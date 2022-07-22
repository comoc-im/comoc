import { SessionUser, useSessionStore } from '@/store/session'
import { Address } from '@comoc-im/id'
import { getSignaler } from '@/network/signaler'
import { EventHub } from '@/network/signaler/eventHub'
import { error, info } from '@/utils/logger'
import { Message, MessageModel } from '@/db/message'
import { P2pConnection } from '@/network/p2p/connection'

type NetworkEventMap = { message: Message }

class P2pNetwork extends EventHub<NetworkEventMap> {
    public readonly connectionRecord = new Map<Address, P2pConnection>()

    public join(currentUser: SessionUser) {
        // listen for new messages
        this.addEventListener('message', async (message) => {
            await new MessageModel(currentUser.address, {
                author: message.from,
                from: message.from,
                to: message.to,
                id: message.id,
                type: message.type,
                timestamp: message.timestamp,
                payload: message.payload,
            }).save()
        })

        // listen for signal
        const signaler = getSignaler(currentUser)
        signaler.addEventListener('webRTCSignal', async ({ from, payload }) => {
            const { description, candidate } = payload as {
                description?: RTCSessionDescription | null
                candidate?: RTCIceCandidate | null
            }
            console.debug('webRTCSignal', description, candidate, from)
            const p2pConn = this.getP2PConnection(currentUser, from)
            await p2pConn.digestSignal(
                signaler,
                currentUser,
                from,
                description,
                candidate
            )
        })
    }

    public leave() {
        this.clearEventListeners()
        this.connectionRecord.forEach((p2pConn) => {
            p2pConn.destroy()
        })
        this.connectionRecord.clear()
    }

    public send(to: Address, message: Message) {
        const { currentUser } = useSessionStore()
        if (!currentUser) {
            error('send skipped, no signed in user', currentUser)
            return
        }
        const p2pConn = this.getP2PConnection(currentUser, to)
        p2pConn.send(JSON.stringify(message))
    }

    private getP2PConnection(
        currentUser: SessionUser,
        remoteUserAddress: Address
    ): P2pConnection {
        const p2pConn = this.connectionRecord.get(remoteUserAddress)
        if (p2pConn) {
            return p2pConn
        }
        const newConn = new P2pConnection(currentUser, remoteUserAddress)
        // listen for new messages
        newConn.addEventListener('message', async (data) => {
            const message = JSON.parse(data)
            info('receive message from p2p connection', message)
            this.dispatchEvent('message', message)
        })
        this.connectionRecord.set(remoteUserAddress, newConn)
        return newConn
    }
}

export const p2pNetwork = new P2pNetwork()
