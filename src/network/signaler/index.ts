import { Address, Signal } from '@comoc-im/message'
import { error } from '@/utils/logger'
import { EventHub } from '@/network/signaler/eventHub'
import { Message } from '@/db/message'
import { createWebSocket } from '@/network/signaler/websocket'

type MessageMap = {
    message: Message
}

export type SignalMessage<K extends keyof MessageMap> = {
    _t: K
    _to: Address
    _from: Address
} & MessageMap[K]

type EventMap = {
    message: SignalMessage<'message'>
}

class Signaler extends EventHub<EventMap> {
    public readonly address: Address
    private readonly webSocketReady: Promise<WebSocket>

    constructor(address: Address) {
        super()
        this.address = address
        this.webSocketReady = createWebSocket(address)
        this.listenMessage()
    }

    private static async fromSignal<K extends keyof MessageMap>(
        s: Signal
    ): Promise<SignalMessage<K>> {
        const blob = new Blob([s.payload], {
            type: 'application/json; charset=utf-8',
        })
        const str = await blob.text()
        const result = JSON.parse(str)
        result._from = s.from
        result._to = s.to
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
                const sm = await Signaler.fromSignal(signal)
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
        const str = JSON.stringify(Object.assign({ _t: type }, data))
        const blob = new Blob([str], {
            type: 'application/json; charset=utf-8',
        })
        const buffer = await blob.arrayBuffer()
        return new Signal(this.address, to, new Uint8Array(buffer))
    }
}

let signaler: Signaler | null = null

export function getSignaler(address: Address): Signaler {
    if (address !== signaler?.address) {
        signaler = new Signaler(address)
    }
    return signaler
}

export function closeSignaler(address: Address): void {
    if (address === signaler?.address) {
        signaler.destroy()
    }
}
