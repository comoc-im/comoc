import { signalerServerWebSocketUrl } from '@/config'
import { Address, Signal, SignIn } from '@comoc-im/message'
import { Signaler } from '@/network/signaler/index'
import { debug, error, warn } from '@/utils/logger'

function createWebSocket(address: Address) {
    return new Promise<WebSocket>((resolve) => {
        const webSocket = new WebSocket(signalerServerWebSocketUrl)
        webSocket.binaryType = 'arraybuffer'

        webSocket.addEventListener('open', function () {
            debug('websocket open')
            webSocket.send(new SignIn(address).encode())
            resolve(webSocket)
        })

        webSocket.addEventListener('error', function (err) {
            error('websocket error', err)
        })

        webSocket.addEventListener('close', function (evt) {
            warn('websocket close', evt)
        })

        webSocket.addEventListener('message', function () {
            // debug('websocket message', msgEvt)
        })
    })
}

export default class Socket implements Signaler {
    private readonly webSocketReady: Promise<WebSocket>

    constructor(address: Address) {
        this.webSocketReady = createWebSocket(address)
    }

    async onMessage(func: (msg: Signal) => unknown): Promise<() => void> {
        const webSocket = await this.webSocketReady
        const listener = (msg: MessageEvent<ArrayBuffer>) => {
            try {
                const signal = Signal.decode(new Uint8Array(msg.data))
                func(signal)
            } catch (err) {
                error(`unrecognized websocket message`, msg.data)
            }
        }

        webSocket.addEventListener('message', listener)
        return () => {
            webSocket.removeEventListener('message', listener)
        }
    }

    async send(data: Signal): Promise<void> {
        const webSocket = await this.webSocketReady
        // debug('websocket sending', data)

        webSocket.send(data.encode())
    }
}
