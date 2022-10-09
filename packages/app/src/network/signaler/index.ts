import { Signal } from '@comoc-im/message'
import { error, info, todo } from '@/utils/logger'
import { EventHub } from './eventHub'
import { createWebSocket } from './websocket'
import { Address, fromAddress, sign, verify } from '@comoc/id'
import { bufferToJson, jsonToBuffer } from '@/utils/buffer'
import { SessionUser } from '@/store/session'

type EventMap = {
    webRTCSignal: {
        payload: Record<string, unknown>
        from: Address
        to: Address
    }
}

export class Signaler extends EventHub<EventMap> {
    private readonly user: SessionUser
    private readonly webSocketReady: Promise<WebSocket>

    constructor(user: SessionUser) {
        super()
        this.user = user
        this.webSocketReady = createWebSocket(user.address)
        this.listenMessage()
    }

    public async send(to: Address, data: unknown): Promise<void> {
        const webSocket = await this.webSocketReady
        const s = await this.toSignal(to, data)
        // debug('websocket sending', data)

        webSocket.send(s.encode())
    }

    public destroy(): void {
        this.clearEventListeners()
        // TODO close websocket
    }

    private async parseSignal(s: Signal) {
        const result = JSON.parse(await bufferToJson(s.payload))
        const source = Object.assign({}, result)
        delete source._s
        if (s.to !== this.user.address) {
            todo('signal not sent to me', result)
        }
        const fromPublicKey = await fromAddress(s.from)
        if (fromPublicKey) {
            const ok = await verify(
                fromPublicKey,
                await jsonToBuffer(JSON.stringify(source)),
                result._s
            )

            if (ok) {
                info('signature matched!')
            } else {
                todo('mismatch signature', result)
            }
        } else {
            todo('signal sender public key fail')
        }

        return { payload: source, to: s.to, from: s.from }
    }

    private async listenMessage(): Promise<void> {
        const webSocket = await this.webSocketReady
        const listener = async (msg: MessageEvent<ArrayBuffer>) => {
            try {
                const signal = Signal.decode(new Uint8Array(msg.data))
                const sm = await this.parseSignal(signal)
                this.dispatchEvent('webRTCSignal', sm)
            } catch (err) {
                error(`unrecognized websocket message`, err, msg.data)
            }
        }

        webSocket.addEventListener('message', listener)
    }

    private async toSignal(to: Address, data: unknown): Promise<Signal> {
        const signature = await sign(
            this.user.privateKey,
            await jsonToBuffer(JSON.stringify(data))
        )

        const sm = Object.assign({ _s: signature }, data)
        const str = JSON.stringify(sm)
        const buffer = await jsonToBuffer(str)
        return new Signal(this.user.address, to, new Uint8Array(buffer))
    }
}

let signaler: Signaler | null = null

export function getSignaler(user: SessionUser): Signaler {
    if (!signaler) {
        signaler = new Signaler(user)
    }
    return signaler
}

export function closeSignaler(): void {
    if (signaler) {
        signaler.destroy()
    }
}
