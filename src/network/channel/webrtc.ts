import store from "@/store";
import {dataChannelLabel} from "@/config";
import {Signaler, SignalingMessageType} from "@/network/signaler";
import Message from "@/db/message";
import {Channel} from "@/network/channel/index";

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
    'stun:stun.xten.com'
]
const config = {
    iceServers: stunServers.map(url => ({urls: url})).slice(0, 2)
}

function connect (signaler: Signaler, userID: string): Promise<RTCDataChannel> {

    const polite = [store.state.currentUser.username, userID].sort().pop() === store.state.currentUser.username
    const pc = new RTCPeerConnection(config);
    let makingOffer = false;

    pc.onnegotiationneeded = async () => {
        try {
            makingOffer = true;
            // eslint-disable-next-line
            // @ts-ignore
            await pc.setLocalDescription();
            signaler.send({
                from: store.state.currentUser.username,
                to: userID,
                type: SignalingMessageType.Description,
                payload: JSON.stringify(pc.localDescription)
            });
        } catch (err) {
            console.error(err);
        } finally {
            makingOffer = false;
        }
    };

    pc.onicecandidate = ({candidate}) => candidate !== null && signaler.send({
        from: store.state.currentUser.username,
        to: userID,
        type: SignalingMessageType.Candidate,
        payload: JSON.stringify(candidate)
    });

    let ignoreOffer = false;

    signaler.onMessage(async ({type, payload, from}) => {
        try {
            switch (type) {
                case SignalingMessageType.Description: {
                    const description = JSON.parse(payload) as RTCSessionDescriptionInit
                    const offerCollision = (description.type == "offer") &&
                        (makingOffer || pc.signalingState != "stable");

                    ignoreOffer = !polite && offerCollision;
                    if (ignoreOffer) {
                        return;
                    }

                    await pc.setRemoteDescription(description);
                    if (description.type == "offer") {
                        // eslint-disable-next-line
                        // @ts-ignore
                        await pc.setLocalDescription();
                        signaler.send({
                            from: store.state.currentUser.username,
                            to: from,
                            type: SignalingMessageType.Description,
                            payload: JSON.stringify(pc.localDescription)
                        })
                    }
                    break;
                }
                case SignalingMessageType.Candidate: {
                    const candidate = JSON.parse(payload) as RTCIceCandidate
                    try {
                        await pc.addIceCandidate(candidate);
                    } catch (err) {
                        if (!ignoreOffer) {
                            throw err;
                        }
                    }
                }
            }

        } catch (err) {
            console.error(err);
        }
    })

    return new Promise<RTCDataChannel>(resolve => {

        let dc: RTCDataChannel
        if (polite) {
            pc.ondatachannel = function ({channel}) {
                dc = channel
                dc.addEventListener('message', function (event) {
                    console.debug('data channel received: ' + event.data)
                })

                dc.onopen = function () {
                    console.log('datachannel open')
                    resolve(channel)
                }

                dc.onclose = function () {
                    console.log('datachannel close')
                }

                dc.onerror = function () {
                    console.log('datachannel close')
                };
            }
        } else {
            dc = pc.createDataChannel(dataChannelLabel)
            dc.addEventListener('message', function (event) {
                console.debug('data channel received: ' + event.data)
            })

            dc.onopen = function () {
                console.log('datachannel open')
                resolve(dc)
            }

            dc.onclose = function () {
                console.log('datachannel close')
            }

            dc.onerror = function () {
                console.log('datachannel close')
            };
        }

    })
}


export class WebRTCChannel implements Channel {

    private readonly dataChannelPromise: Promise<RTCDataChannel>
    private listener: ((msg: MessageEvent<string>) => unknown) | null = null


    constructor (signaler: Signaler, userID: string) {
        this.dataChannelPromise = connect(signaler, userID)
    }


    async send (msg: Message): Promise<void> {

        const channel = await this.dataChannelPromise

        // fixme send multiple data types
        channel.send(JSON.stringify(msg))

    }


    async onMessage (func: (msg: Message) => unknown): Promise<void> {

        const channel = await this.dataChannelPromise

        // fixme drop previous listener
        if (this.listener) {
            channel.removeEventListener('message', this.listener)
        }

        this.listener = function (msgEvt: MessageEvent<string>) {
            func(JSON.parse(msgEvt.data))
        }
        channel.addEventListener('message', this.listener)

    }

}
