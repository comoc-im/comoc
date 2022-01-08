import { Address, Signal } from '@comoc-im/message'
import { error } from '@/utils/logger'
import { EventHub } from '@/network/signaler/eventHub'
import Message from '@/db/message'
import { createWebSocket } from '@/network/signaler/websocket'

type EventMap = {
    message: Message
}

class Signaler extends EventHub<EventMap> {
    private readonly webSocketReady: Promise<WebSocket>
    public readonly address: Address

    constructor(address: Address) {
        super()
        this.address = address
        this.webSocketReady = createWebSocket(address)
        this.listenMessage()
    }

    private async listenMessage(): Promise<void> {
        const webSocket = await this.webSocketReady
        const listener = async (msg: MessageEvent<ArrayBuffer>) => {
            try {
                const signal = Signal.decode(new Uint8Array(msg.data))
                const m = await Message.fromSignal(signal, signal.to)
                this.dispatchEvent('message', m)
            } catch (err) {
                error(`unrecognized websocket message`, msg.data)
            }
        }

        webSocket.addEventListener('message', listener)
    }

    public async send(data: Signal): Promise<void> {
        const webSocket = await this.webSocketReady
        // debug('websocket sending', data)

        webSocket.send(data.encode())
    }

    public destroy(): void {
        this.clearEventListeners()
        // TODO close websocket
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
