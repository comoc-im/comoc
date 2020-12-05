<template>
    <div class="comoc-web">
        <div class="contacts">
            <div v-for="contact in contacts"
                 :key="contact.username"
                 :title="'chat with ' + contact.username"
                 :class="{active: activeContactID === contact.username}"
                 class="contact"
                 @click="selectContact(contact)">{{ contact.username }}
            </div>
        </div>

        <div class="chat">
            <div class="chat-view">
                <div v-for="msg in msgList" :key="msg" class="msg">{{ msg.payload }}</div>
            </div>
            <div class="chat-input">
                <textarea v-model="inputText" class="chat-textarea"></textarea>
                <button class="send-btn" type="button" @click="send">Send</button>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
    import {computed, defineComponent, reactive, ref} from 'vue'
    import User from "@/db/user";
    import Socket from "@/network/signaler/websocket";
    import store from "@/store";
    import {WebRTCChannel} from "@/network/channel/webrtc";
    import {Channel} from "@/network/channel";
    import Message, {MessageType} from "@/db/message";

    export default defineComponent({
        name: 'Comoc-Web',
        setup () {
            const signaler = new Socket(store.state.currentUser.username)
            let contacts = ref<User[]>([]);
            User.findAll().then((users) => users.filter(user => user.username !== store.state.currentUser.username))
                .then((c) => {
                    contacts.value = c
                })
            const channelCache = new Map<string, Channel>()

            const activeContactID = ref<string>('')
            const inputText = ref<string>('')
            const msgList = reactive<Message[]>([])
            const currentContact = computed(() => contacts.value.find((c) => c.username === activeContactID.value))

            function selectContact (contact: User) {
                activeContactID.value = contact.publicKey

                let channel = channelCache.get(contact.username)
                if (!channel) {
                    channel = new WebRTCChannel(signaler, contact.username)
                    channelCache.set(contact.username, channel)
                }

                channel.onMessage((msg) => {
                    msgList.push(msg)
                })
            }

            function send () {

                let channel = channelCache.get(activeContactID.value)

                if (!channel) {
                    console.warn('send without channel')
                    return
                }

                if (!currentContact.value) {
                    console.warn('send witout currentContract')
                    return
                }

                channel.send(
                    new Message(MessageType.Text, inputText.value, store.state.currentUser.username, currentContact.value.username)
                );

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
        }
    })
</script>
<style lang="scss">
    @import "../styles/base/variable";

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
                    float: left;
                    padding: 1em;
                    border: 1px dotted $border-color;
                    border-radius: 6px;
                    background-color: #fff;
                    clear: both;

                    &:before {
                        content: attr(data-owner);
                        position: absolute;
                        bottom: -100%;
                        left: 0;
                        color: lightgrey;
                        user-select: none;
                    }

                    &.self {
                        float: right
                    }
                }
            }

            .chat-input {
                display: flex;
                height: 150px;

                .chat-textarea {
                    flex: 1;
                    padding: 1em .5em;
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
