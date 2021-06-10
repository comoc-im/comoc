import { dataChannelLabel } from '@/config'
import { Signaler, SignalingMessageType } from '@/network/signaler'
import Message from '@/db/message'
import { Channel } from '@/network/channel/index'
import { debug } from '@/utils/logger'

interface ConnectionConfig {
    pc: RTCPeerConnection
    makingOffer: boolean
    ignoreOffer: boolean
    polite: boolean
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
    private static readonly channelCache = new Map<
        string,
        Promise<RTCDataChannel>
    >()
    private static readonly connectionCache = new Map<
        string,
        ConnectionConfig
    >()
    private static username: string
    private listener: ((msg: MessageEvent<string>) => unknown) | null = null
    private readonly targetUserID: string

    constructor(targetUserID: string) {
        this.targetUserID = targetUserID
        WebRTCChannel.getDataChannel(targetUserID)
    }

    public static init(username: string, signaler: Signaler): void {
        this.username = username
        // init signaler
        this.signaler = signaler
        // cache all RTC offer descriptions
        this.signaler.onMessage(async ({ type, payload, from }) => {
            const cc = await WebRTCChannel.getConnection(from)
            try {
                switch (type) {
                    case SignalingMessageType.Description: {
                        const description = JSON.parse(
                            payload
                        ) as RTCSessionDescriptionInit
                        const offerCollision =
                            description.type == 'offer' &&
                            (cc.makingOffer || cc.pc.signalingState != 'stable')

                        cc.ignoreOffer = !cc.polite && offerCollision
                        if (cc.ignoreOffer) {
                            return
                        }

                        await cc.pc.setRemoteDescription(description)
                        if (description.type == 'offer') {
                            // eslint-disable-next-line
                            // @ts-ignore
                            await pc.setLocalDescription()
                            this.signaler.send({
                                from: this.username,
                                to: from,
                                type: SignalingMessageType.Description,
                                payload: JSON.stringify(cc.pc.localDescription),
                            })
                        }
                        break
                    }
                    case SignalingMessageType.Candidate: {
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
            return con
        }

        const polite =
            [this.username, targetUserID].sort().pop() === this.username

        const newCC: ConnectionConfig = {
            pc: new RTCPeerConnection(config),
            ignoreOffer: false,
            makingOffer: false,
            polite,
        }
        newCC.pc.onnegotiationneeded = async () => {
            debug('onnegotiationneeded')
            try {
                newCC.makingOffer = true
                await newCC.pc.setLocalDescription()
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

        newCC.pc.onicecandidate = ({ candidate }) => {
            debug('onicecandidate')
            candidate !== null &&
                this.signaler.send({
                    from: this.username,
                    to: targetUserID,
                    type: SignalingMessageType.Candidate,
                    payload: JSON.stringify(candidate),
                })
        }

        return newCC
    }

    private static async getDataChannel(
        targetUserID: string
    ): Promise<RTCDataChannel> {
        let p = WebRTCChannel.channelCache.get(targetUserID)

        if (!p) {
            const cc = await WebRTCChannel.getConnection(targetUserID)
            p = new Promise<RTCDataChannel>((resolve) => {
                let dc: RTCDataChannel
                if (cc.polite) {
                    cc.pc.ondatachannel = function ({ channel }) {
                        debug('ondatachannel')
                        dc = channel
                        dc.addEventListener('message', function (event) {
                            debug('data channel received: ' + event.data)
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
                    dc = cc.pc.createDataChannel(dataChannelLabel)
                    dc.addEventListener('message', function (event) {
                        debug('data channel received: ' + event.data)
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
            WebRTCChannel.channelCache.set(targetUserID, p)
        }

        return p
    }

    async send(msg: Message): Promise<void> {
        const channel = await WebRTCChannel.getDataChannel(this.targetUserID)

        // fixme send multiple data types
        channel.send(JSON.stringify(msg))
    }

    async onMessage(func: (msg: Message) => unknown): Promise<void> {
        const channel = await WebRTCChannel.getDataChannel(this.targetUserID)

        // drop previous listener
        if (this.listener) {
            channel.removeEventListener('message', this.listener)
        }

        this.listener = function (msgEvt: MessageEvent<string>) {
            func(JSON.parse(msgEvt.data))
        }
        channel.addEventListener('message', this.listener)
    }
}
