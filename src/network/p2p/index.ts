import { SessionUser } from '@/store/session'
import { Address } from '@comoc-im/id'
import { getSignaler, Signaler } from '@/network/signaler'

// class P2pConnection {
//     private readonly signaler: Signaler
//
//     constructor(currentUser: SessionUser, remoteUserAddress: Address) {
//         this.signaler = getSignaler(currentUser)
//     }
//
//     public async send(
//         to: Address,
//         data: SignalMessage<'message'>
//     ): Promise<void> {
//         return this.signaler.send(to, 'message', data)
//     }
// }

export type P2PConnection = Signaler

export function getP2PConnection(
    currentUser: SessionUser,
    remoteUserAddress: Address
): P2PConnection {
    return getSignaler(currentUser)
}
