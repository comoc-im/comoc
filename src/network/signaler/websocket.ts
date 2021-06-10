import { signalerServerWebSocketUrl } from '@/config'
import { Signaler, SignalingMessage } from '@/network/signaler/index'
import { debug, error } from '@/utils/logger'

function createWebSocket(username: string) {
    return new Promise<WebSocket>((resolve) => {
        const webSocket = new WebSocket(
            signalerServerWebSocketUrl + `?username=${username}`
        )

        webSocket.addEventListener('open', function () {
            debug('websocket open')
            resolve(webSocket)
        })

        webSocket.addEventListener('error', function (err) {
            error('websocket error', err)
        })

        webSocket.addEventListener('close', function () {
            debug('websocket close')
        })

        webSocket.addEventListener('message', function (msgEvt) {
            debug('websocket message', msgEvt)
        })
    })
}

export default class Socket implements Signaler {
    private readonly webSocketReady: Promise<WebSocket>

    constructor(username: string) {
        this.webSocketReady = createWebSocket(username)

        // setInterval(() => {
        //     this.send({
        //         from: username,
        //         to: username,
        //         type: SignalingMessageType.Heartbeat,
        //         payload: '',
        //     })
        // }, 5000)
    }

    async onMessage(
        func: (msg: SignalingMessage) => unknown
    ): Promise<() => void> {
        const webSocket = await this.webSocketReady
        const listener = (msg: MessageEvent<string>) => {
            const data = JSON.parse(msg.data) as SignalingMessage
            func(data)
        }

        webSocket.addEventListener('message', listener)
        return () => {
            webSocket.removeEventListener('message', listener)
        }
    }

    async send(data: SignalingMessage): Promise<void> {
        const webSocket = await this.webSocketReady
        debug('websocket sending', data)

        webSocket.send(JSON.stringify(data))
    }
}
