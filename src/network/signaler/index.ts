import { Signal } from '@comoc-im/message'
import { error, info, todo } from '@/utils/logger'
import { EventHub } from '@/network/signaler/eventHub'
import { Message } from '@/db/message'
import { createWebSocket } from '@/network/signaler/websocket'
import { Address, fromAddress, sign, verify } from '@comoc-im/id'
import { bufferToJson, jsonToBuffer } from '@/utils/buffer'
import { SessionUser } from '@/store/session'

type MessageMap = {
    message: Message
}

export type SignalMessage<K extends keyof MessageMap> = {
    _t: K
    _s: string
} & MessageMap[K]

type EventMap = {
    message: SignalMessage<'message'>
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

    private async fromSignal<K extends keyof MessageMap>(
        s: Signal
    ): Promise<SignalMessage<K>> {
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

        return result
    }

    public async send<K extends keyof EventMap>(
        to: Address,
        type: K,
        data: MessageMap[K]
    ): Promise<void> {
        const webSocket = await this.webSocketReady
        const s = await this.toSignal(to, type, data)
        // debug('websocket sending', data)

        webSocket.send(s.encode())
    }

    public destroy(): void {
        this.clearEventListeners()
        // TODO close websocket
    }

    private async listenMessage(): Promise<void> {
        const webSocket = await this.webSocketReady
        const listener = async (msg: MessageEvent<ArrayBuffer>) => {
            try {
                const signal = Signal.decode(new Uint8Array(msg.data))
                const sm = await this.fromSignal(signal)
                switch (sm._t) {
                    case 'message':
                        this.dispatchEvent('message', sm)
                }
            } catch (err) {
                error(`unrecognized websocket message`, msg.data)
            }
        }

        webSocket.addEventListener('message', listener)
    }

    private async toSignal<K extends keyof EventMap>(
        to: Address,
        type: K,
        data: MessageMap[K]
    ): Promise<Signal> {
        const _sm = Object.assign(
            {
                _from: this.user.address,
                _to: to,
                _t: type,
            },
            data
        )
        const signature = await sign(
            this.user.privateKey,
            await jsonToBuffer(JSON.stringify(_sm))
        )

        const sm: SignalMessage<K> = Object.assign({ _s: signature }, _sm)
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
