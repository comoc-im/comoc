<template>
    <div class="comoc-web">
    </div>
</template>
<script lang="ts">
    import {defineComponent} from 'vue'
    import {listenPeerInfo, registerCandidate, registerDescription} from './signaler'
    import {useRoute} from 'vue-router'
    import {watch} from '@vue/runtime-core'

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

    export default defineComponent({
        name: 'Comoc-Web',
        setup() {
            const route = useRoute()
            const config = {
                iceServers: stunServers.map(url => ({urls: url})).slice(0, 2)
            }

            watch(
                () => route.query,
                async query => {
                    const username = query.username as string
                    if (!username) {
                        return
                    }
                    const targetUsername = username === 'Alice' ? 'Bob' : 'Alice'
                    const polite = username === 'Alice'

                    console.log('setup', username)
                    const pc = new RTCPeerConnection(config);
                    (window as any).pc = pc

                    let makingOffer = false

                    pc.onnegotiationneeded = async () => {
                        try {
                            makingOffer = true
                            // eslint-disable-next-line
                            // @ts-ignore
                            await pc.setLocalDescription()
                            console.log('send description', pc.localDescription?.type)
                            registerDescription(pc.localDescription as RTCSessionDescription, username)
                        } catch (err) {
                            console.error(err)
                        } finally {
                            makingOffer = false
                        }
                    }

                    pc.onicecandidate = ({candidate}) => {
                        console.log('send candidate', candidate?.type)
                        registerCandidate(candidate as RTCIceCandidate, username)
                    }

                    let dc: RTCDataChannel
                    if (polite) {
                        pc.ondatachannel = function ({channel}) {
                            dc = channel
                            dc.onmessage = function (event) {
                                console.log('received: ' + event.data)
                                setTimeout(() => {
                                    dc.send(String(Number(event.data) + 1))
                                }, 1000)
                            }

                            dc.onopen = function () {
                                console.log('datachannel open')
                            }

                            dc.onclose = function () {
                                console.log('datachannel close')
                            }

                            dc.onerror = function () {
                                console.log('datachannel close')
                            };

                            (window as any).dc = dc;
                            (window as any).send = function () {
                                dc.send(String(1))
                            }
                        }
                    } else {
                        dc = pc.createDataChannel('Comoc IM')
                        dc.onmessage = function (event) {
                            console.log('received: ' + event.data)
                            setTimeout(() => {
                                dc.send(String(Number(event.data) + 1))
                            }, 1000)
                        }

                        dc.onopen = function () {
                            console.log('datachannel open')
                        }

                        dc.onclose = function () {
                            console.log('datachannel close')
                        }

                        dc.onerror = function () {
                            console.log('datachannel close')
                        };

                        (window as any).dc = dc;
                        (window as any).send = function () {
                            dc.send(String(1))
                        }
                    }

                    let ignoreOffer = false
                    listenPeerInfo(targetUsername, async ({description, candidates}) => {
                        console.info(pc.connectionState, dc?.readyState)
                        try {
                            if (description) {
                                console.log('receive description', description?.type)
                                const offerCollision = (description.type === 'offer') &&
                                    (makingOffer || pc.signalingState !== 'stable')

                                ignoreOffer = !polite && offerCollision
                                if (ignoreOffer) {
                                    return
                                }

                                await pc.setRemoteDescription(description)
                                if (description.type === 'offer') {
                                    // eslint-disable-next-line
                                    // @ts-ignore
                                    await pc.setLocalDescription()
                                    registerDescription(pc.localDescription as RTCSessionDescription, username)
                                }
                            }

                            if (candidates) {
                                console.log('receive candidates', candidates.map((type) => type))
                                try {
                                    for (const candidate of candidates) {
                                        await pc.addIceCandidate(candidate)
                                    }
                                } catch (err) {
                                    if (!ignoreOffer) {
                                        throw err
                                    }
                                }
                            }
                        } catch (err) {
                            console.error(err)
                        }
                    })

                }
            )
        }
    })
</script>
<style lang="scss">
    #app {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #2c3e50;
    }


</style>
