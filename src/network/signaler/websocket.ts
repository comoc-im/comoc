import { Address, SignIn } from '@comoc-im/message'
import { signalerServerWebSocketUrl } from '@/config'
import { debug, error, warn } from '@/utils/logger'

export function createWebSocket(address: Address) {
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
