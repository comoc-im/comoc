import { EventHub } from '@/network/signaler/eventHub'
import { SessionUser } from '@/store/session'
import { Address } from '@comoc-im/id'
import { getSignaler, Signaler } from '@/network/signaler'
import { debug, todo } from '@/utils/logger'
import { P2pCrypto } from '@/network/p2p/crypto'

const stunServers = [
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
    'stun:stun3.l.google.com:19302',
    'stun:stun4.l.google.com:19302',
    'stun:23.21.150.121',
    'stun:stun01.sipphone.com',
    'stun:stun.ekiga.net',
    'stun:stun.fwdnet.net',
    'stun:stun.ideasip.com',
    'stun:stun.iptel.org',
    'stun:stun.rixtelecom.se',
    'stun:stun.schlund.de',
    'stun:stunserver.org',
    'stun:stun.softjoys.com',
    'stun:stun.voiparound.com',
    'stun:stun.voipbuster.com',
    'stun:stun.voipstunt.com',
    'stun:stun.voxgratia.org',
    'stun:stun.xten.com',
]
const config = {
    iceServers: stunServers.map((url) => ({ urls: url })).slice(0, 5),
}

function amIPolite(me: Address, remote: Address): boolean {
    return [me, remote].sort().pop() === remote
}

type EventMap = { message: string; close: undefined }

export class P2pConnection extends EventHub<EventMap> {
    polite: boolean
    makingOffer = false
    ignoreOffer = false
    pc: RTCPeerConnection
    dc: RTCDataChannel | null = null
    private readonly crypto: P2pCrypto

    constructor(
        currentUser: SessionUser,
        remoteUserAddress: Address,
        crypto: P2pCrypto
    ) {
        super()
        this.polite = amIPolite(currentUser.address, remoteUserAddress)
        this.pc = new RTCPeerConnection(config)
        this.crypto = crypto
        this.init(currentUser, remoteUserAddress)
    }

    private async init(currentUser: SessionUser, remoteUserAddress: Address) {
        const signaler = getSignaler(currentUser)
        debug('send ecdh public key', remoteUserAddress)
        const ecdhPublicKey = await this.crypto.getEcdhPublicKey()
        await signaler.send(remoteUserAddress, {
            ecdhPublicKey,
        })
        debug('connecting', remoteUserAddress)
        this.connect(signaler, currentUser.address, remoteUserAddress)
        this.initDataChannel()
    }

    private initDataChannel() {
        debug({ polite: this.polite })
        if (this.polite) {
            this.pc.ondatachannel = (evt) => {
                const dc = evt.channel
                this.dc = dc
                dc.onmessage = (event) => {
                    this.onMessage(event.data)
                }
                dc.onopen = function () {
                    console.log('datachannel open')
                }

                dc.onclose = () => {
                    console.warn('datachannel close')
                    this.dispatchEvent('close', undefined)
                }
            }
        } else {
            const dc = this.pc.createDataChannel('my channel')
            dc.binaryType = 'arraybuffer'
            this.dc = dc
            dc.onmessage = (event) => {
                this.onMessage(event.data)
            }

            dc.onopen = function () {
                console.log('datachannel open')
            }

            dc.onclose = () => {
                console.warn('datachannel close')
                this.dispatchEvent('close', undefined)
            }
        }
    }

    private async onMessage(payload: ArrayBuffer): Promise<void> {
        const data = await this.crypto.decrypt(payload)
        console.log('received: ' + data)
        this.dispatchEvent('message', data)
    }

    public async digestSignal(
        signaler: Signaler,
        currentUser: SessionUser,
        from: Address,
        ecdhPublicKey?: string,
        description?: RTCSessionDescription | null,
        candidate?: RTCIceCandidate | null
    ) {
        try {
            if (ecdhPublicKey) {
                const changed = await this.crypto.deriveKey(ecdhPublicKey)
                if (changed) {
                    await signaler.send(from, {
                        ecdhPublicKey: await this.crypto.getEcdhPublicKey(),
                    })
                }
            } else if (description) {
                const offerCollision =
                    description.type == 'offer' &&
                    (this.makingOffer || this.pc.signalingState != 'stable')

                this.ignoreOffer = !this.polite && offerCollision
                if (this.ignoreOffer) {
                    return
                }

                await this.pc.setRemoteDescription(description)
                if (description.type == 'offer') {
                    await this.pc.setLocalDescription()
                    await signaler.send(from, {
                        from: currentUser.address,
                        description: this.pc.localDescription,
                    })
                }
            } else if (candidate) {
                try {
                    await this.pc.addIceCandidate(candidate)
                } catch (err) {
                    if (!this.ignoreOffer) {
                        throw err
                    }
                }
            }
        } catch (err) {
            console.error(err)
        }
    }

    private connect(
        signaler: Signaler,
        currentUserAdd: Address,
        remoteUserAddress: Address
    ) {
        this.pc.onnegotiationneeded = async () => {
            debug('onnegotiationneeded')
            try {
                this.makingOffer = true
                await this.pc.setLocalDescription()
                await signaler.send(remoteUserAddress, {
                    description: this.pc.localDescription,
                    from: currentUserAdd,
                })
            } catch (err) {
                console.error(err)
            } finally {
                this.makingOffer = false
            }
        }
        this.pc.onicecandidate = ({ candidate }) => {
            debug('onicecandidate')
            signaler.send(remoteUserAddress, {
                candidate,
                from: currentUserAdd,
            })
        }

        this.pc.onconnectionstatechange = (evt) => {
            console.warn('connectionstatechange', evt)
        }
    }

    public send(data: string) {
        this.crypto.encrypt(data).then((encrypted) => {
            this.dc?.send(encrypted)
        })
    }

    public destroy() {
        this.clearEventListeners()
        this.dc?.close()
        this.pc.close()
    }
}
