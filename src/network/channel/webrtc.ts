import { dataChannelLabel } from '@/config'
import { Signaler, SignalingMessageType } from '@/network/signaler'
import Message, { MessageType } from '@/db/message'
import { Channel } from '@/network/channel/index'
import { debug } from '@/utils/logger'

interface ConnectionConfig {
    pc: RTCPeerConnection
    makingOffer: boolean
    ignoreOffer: boolean
    polite: boolean
    datachannel: Promise<RTCDataChannel>
}

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
    iceServers: stunServers.map((url) => ({ urls: url })).slice(0, 2),
}

export class WebRTCChannel implements Channel {
    private static signaler: Signaler
    private static readonly connectionCache = new Map<
        string,
        ConnectionConfig
    >()
    private static username: string
    private listener: ((msg: MessageEvent<string>) => unknown) | null = null
    private readonly targetUserID: string

    constructor(targetUserID: string) {
        this.targetUserID = targetUserID
        WebRTCChannel.getConnection(targetUserID)
    }

    public static init(username: string, signaler: Signaler): void {
        this.username = username
        // init signaler
        this.signaler = signaler
        // cache all RTC offer descriptions
        this.signaler.onMessage(async ({ type, payload, from }) => {
            try {
                switch (type) {
                    case SignalingMessageType.Description: {
                        const cc = await WebRTCChannel.getConnection(from)
                        const description = JSON.parse(
                            payload
                        ) as RTCSessionDescriptionInit
                        debug('receive description', description)

                        if (description.type === 'offer') {
                            const offerCollision =
                                cc.makingOffer ||
                                cc.pc.signalingState != 'stable'

                            cc.ignoreOffer = !cc.polite && offerCollision

                            if (cc.ignoreOffer) {
                                return
                            }

                            await cc.pc.setRemoteDescription(description)
                            await cc.pc.setLocalDescription()

                            debug('send description answer', description)
                            this.signaler.send({
                                from: this.username,
                                to: from,
                                type: SignalingMessageType.Description,
                                payload: JSON.stringify(cc.pc.localDescription),
                            })
                        } else if (description.type === 'answer') {
                            await cc.pc.setRemoteDescription(description)
                        }

                        break
                    }
                    case SignalingMessageType.Candidate: {
                        const cc = await WebRTCChannel.getConnection(from)
                        const candidate = JSON.parse(payload) as RTCIceCandidate
                        try {
                            await cc.pc.addIceCandidate(candidate)
                        } catch (err) {
                            if (!cc.ignoreOffer) {
                                throw err
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(err)
            }
        })
    }

    private static async getConnection(
        targetUserID: string
    ): Promise<ConnectionConfig> {
        const con = WebRTCChannel.connectionCache.get(targetUserID)
        if (con) {
            debug('use connection from cache', targetUserID)
            return con
        }

        debug('create connection for', targetUserID)
        const polite =
            [this.username, targetUserID].sort().pop() === this.username
        const pc = new RTCPeerConnection(config)

        pc.onnegotiationneeded = async () => {
            debug('onnegotiationneeded', newCC.pc.connectionState)
            try {
                newCC.makingOffer = true
                await newCC.pc.setLocalDescription()
                debug('send description offer', newCC.pc.localDescription)
                this.signaler.send({
                    from: this.username,
                    to: targetUserID,
                    type: SignalingMessageType.Description,
                    payload: JSON.stringify(newCC.pc.localDescription),
                })
            } catch (err) {
                console.error(err)
            } finally {
                newCC.makingOffer = false
            }
        }

        pc.onicecandidate = ({ candidate }) => {
            debug('onicecandidate', candidate)
            candidate !== null &&
                this.signaler.send({
                    from: this.username,
                    to: targetUserID,
                    type: SignalingMessageType.Candidate,
                    payload: JSON.stringify(candidate),
                })
        }

        // polite peer should wait datachannel event
        const datachannel = new Promise<RTCDataChannel>((resolve) => {
            let dc: RTCDataChannel
            if (polite) {
                // polite peer should wait datachannel event
                pc.ondatachannel = function ({ channel }) {
                    debug('ondatachannel')
                    dc = channel
                    dc.addEventListener('message', function (event) {
                        debug('datachannel received: ' + event.data)
                    })

                    dc.onopen = function () {
                        debug('datachannel open')
                        resolve(channel)
                    }

                    dc.onclose = function () {
                        debug('datachannel close')
                    }

                    dc.onerror = function () {
                        debug('datachannel close')
                    }
                }
            } else {
                dc = pc.createDataChannel(dataChannelLabel)
                debug('create dataChannel')
                dc.addEventListener('message', function (event) {
                    debug('datachannel received: ' + event.data)
                })

                dc.onopen = function () {
                    debug('datachannel open')
                    resolve(dc)
                }

                dc.onclose = function () {
                    debug('datachannel close')
                }

                dc.onerror = function () {
                    debug('datachannel close')
                }
            }
        })

        const newCC: ConnectionConfig = {
            pc,
            ignoreOffer: false,
            makingOffer: false,
            polite,
            datachannel,
        }
        WebRTCChannel.connectionCache.set(targetUserID, newCC)
        return newCC
    }

    async send(msg: Message): Promise<void> {
        debug('sending message', msg)
        const cc = await WebRTCChannel.getConnection(this.targetUserID)
        const channel = await cc.datachannel

        // fixme send multiple data types
        channel.send(JSON.stringify(msg))
    }

    async onMessage(func: (msg: Message) => unknown): Promise<void> {
        const cc = await WebRTCChannel.getConnection(this.targetUserID)
        const channel = await cc.datachannel

        // drop previous listener
        if (this.listener) {
            channel.removeEventListener('message', this.listener)
        }

        this.listener = function (msgEvt: MessageEvent<string>) {
            const msgObj = JSON.parse(msgEvt.data) as Message
            debug('receiving message', msgObj)
            const msg = new Message(
                MessageType.Text,
                msgObj.payload,
                msgObj.from,
                msgObj.to
            )

            msg.save()
            func(msg)
        }
        channel.addEventListener('message', this.listener)
    }
}
