import { signalerServerWebSocketUrl } from '@/config'
import { Signaler, SignalingMessage } from '@/network/signaler/index'

function createWebSocket(username: string) {
    return new Promise<WebSocket>((resolve) => {
        const webSocket = new WebSocket(
            signalerServerWebSocketUrl + `?username=${username}`
        )

        webSocket.addEventListener('open', function () {
            console.debug('websocket open')
            resolve(webSocket)
        })

        webSocket.addEventListener('error', function (err) {
            console.error('websocket error', err)
        })

        webSocket.addEventListener('close', function () {
            console.debug('websocket close')
        })

        webSocket.addEventListener('message', function (msgEvt) {
            console.debug('websocket message', msgEvt)
        })
    })
}

const socketMap = new Map<string, Socket>()

export default class Socket implements Signaler {
    private readonly webSocketReady: Promise<WebSocket>

    constructor(username: string) {
        const socket = socketMap.get(username)

        if (socket) {
            this.webSocketReady = socket.webSocketReady
            return socket
        }

        this.webSocketReady = createWebSocket(username)
        socketMap.set(username, this)
        return this
    }

    async onMessage(func: (msg: SignalingMessage) => unknown): Promise<void> {
        const webSocket = await this.webSocketReady

        webSocket.addEventListener('message', (msg) => {
            const data = JSON.parse(msg.data) as SignalingMessage
            func(data)
        })
    }

    async send(data: SignalingMessage): Promise<void> {
        const webSocket = await this.webSocketReady

        webSocket.send(JSON.stringify(data))
    }
}
