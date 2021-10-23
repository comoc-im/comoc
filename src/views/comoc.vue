<template>
    <div class="comoc-web">
        <div class="contacts">
            <div
                v-for="contact in contacts"
                :key="contact.username"
                :title="'chat with ' + contact.username"
                :class="{ active: activeContactID === contact.username }"
                class="contact"
                @click="selectContact(contact)"
            >
                {{ contact.username }}
            </div>
        </div>

        <div class="chat">
            <div class="chat-view">
                <div
                    v-for="msg in msgList"
                    :key="msg"
                    :class="[
                        'msg',
                        {
                            target:
                                msg.to === $store.state.currentUser.username,
                            self:
                                msg.from === $store.state.currentUser.username,
                        },
                    ]"
                >
                    <p class="msg-content">{{ msg.payload }}</p>
                    <p class="msg-time">
                        {{ $filters.toDateTimeStr(msg.timestamp) }}
                    </p>
                </div>
            </div>
            <div class="chat-input">
                <textarea v-model="inputText" class="chat-textarea"></textarea>
                <button class="send-btn" type="button" @click="send">
                    Send
                </button>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import User from '@/db/user'
import store from '@/store'
import { WebRTCChannel } from '@/network/channel/webrtc'
import Message, { MessageType } from '@/db/message'
import { debug, info } from '@/utils/logger'
import Socket from '@/network/signaler/websocket'

export default defineComponent({
    name: 'Comoc-Web',
    setup() {
        // init WebRTCChannel
        WebRTCChannel.init(
            store.state.currentUser.username,
            new Socket(store.state.currentUser.username)
        )

        let contacts = ref<User[]>([])
        User.findAll()
            .then((users) =>
                users.filter(
                    (user) => user.username !== store.state.currentUser.username
                )
            )
            .then((c) => {
                contacts.value = c
            })

        const activeContactID = ref<string>('')
        const inputText = ref<string>('')
        const msgList = ref<Message[]>([])
        const currentContact = computed(() =>
            contacts.value.find((c) => c.username === activeContactID.value)
        )

        function selectContact(contact: User) {
            debug('select contact', contact)
            activeContactID.value = contact.username

            Message.getHistoryWith(
                store.state.currentUser.username,
                contact.username
            ).then((messages) => {
                msgList.value = messages
            })

            let channel = new WebRTCChannel(contact.username)
            debug('get channel', channel)

            channel.onMessage((msg) => {
                info('receive message', msg)
                msgList.value.push(msg)
            })
        }

        function send() {
            let channel = new WebRTCChannel(activeContactID.value)

            if (!channel) {
                console.warn('send without channel')
                return
            }

            if (!currentContact.value) {
                console.warn('send without currentContract')
                return
            }

            const msg = new Message(
                MessageType.Text,
                inputText.value,
                store.state.currentUser.username,
                currentContact.value.username
            )

            msg.save()
            channel.send(msg)

            inputText.value = ''
        }

        return {
            contacts,
            activeContactID,
            inputText,
            msgList,
            selectContact,
            send,
        }
    },
})
</script>
<style lang="scss">
@import '../styles/base/variable';

.comoc-web {
    display: flex;
    height: 100vh;

    .contacts {
        min-width: 15vw;
        max-width: 300px;

        .contact {
            padding: 12px;
            cursor: pointer;

            &:hover {
                background-color: lightblue;
            }

            &:active,
            &.active {
                color: white;
                background-color: deepskyblue;
            }

            ~ .contact {
                border-top: $border-color;
            }
        }
    }

    .chat {
        flex: 1;
        display: flex;
        flex-direction: column;

        .chat-view {
            flex: 1;
            overflow: auto;
            padding: 20px;
            border-left: 1px solid $border-color;
            background-color: #f1f1f1;

            &:empty:before {
                content: '暂无消息';
                display: block;
                text-align: center;
                color: lightgrey;
                user-select: none;
            }

            .msg {
                margin: 1em 0;

                &.self {
                    text-align: right;

                    .msg-content {
                        filter: drop-shadow(2px 3px 3px $border-color);
                    }
                }

                &.target {
                    text-align: left;

                    .msg-content {
                        filter: drop-shadow(-2px 3px 3px $border-color);
                    }
                }

                .msg-content {
                    display: inline-block;
                    text-align: left;
                    margin: 0;
                    padding: 0.6em 1em;
                    font-size: 14px;
                    border: 1px solid $border-color;
                    border-radius: 6px;
                    background-color: #fff;
                }

                .msg-time {
                    white-space: nowrap;
                    font-size: 12px;
                    line-height: 20px;
                    margin: 0;
                    color: darkgray;
                    user-select: none;
                }
            }
        }

        .chat-input {
            display: flex;
            height: 150px;

            .chat-textarea {
                flex: 1;
                padding: 1em 0.5em;
                line-height: 1.6em;
                resize: none;
                border-top: 1px solid $border-color;
                border-left: 1px solid $border-color;
                border-right: none;
                border-bottom: none;
                outline: none;

                &:focus {
                    box-shadow: 0 0 0 2px deepskyblue;
                }
            }

            .send-btn {
                padding: 0 20px;
                border: none;
                appearance: none;
                outline: none;
                cursor: pointer;
                letter-spacing: 1px;
                background-color: deepskyblue;
                color: white;

                &:hover {
                    background-color: darken(deepskyblue, 5%);
                }
            }
        }
    }
}
</style>
