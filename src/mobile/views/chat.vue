<template>
    <div class="chat">
        <van-nav-bar
            :title="contact.username || contact.address"
            left-text="Back"
            @click-left="$router.back()"
            left-arrow
        >
            <!-- todo message search
            <template #right>
                <van-icon name="search" />
            </template>
            -->
        </van-nav-bar>
        <div class="chat-view">
            <div
                v-for="msg in msgList"
                :key="msg.id"
                :style="{
                    color:
                        msg.author === contact.address
                            ? getUserColor(contact.address)
                            : '',
                }"
                :class="[
                    'msg',
                    {
                        target: msg.author === contact.address,
                        self: msg.author === currentUser.address,
                    },
                ]"
            >
                <p class="msg-content">{{ msg.payload }}</p>
                <p class="msg-time">
                    {{ toDateTimeStr(msg.timestamp) }}
                </p>
            </div>
        </div>
        <div class="chat-input">
            <textarea
                v-model="inputText"
                class="chat-textarea"
                @keydown.enter.prevent="send"
            ></textarea>
            <button class="send-btn" type="button" @click="send">Send</button>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { useSessionStore } from '@/store'
import { useRoute } from 'vue-router'
import { getSignaler, SignalMessage } from '@/network/signaler'
import { notice } from '@/utils/notification'
import { onBeforeUnmount, ref } from 'vue'
import { Message, MessageModel, MessageType, newMessageId } from '@/db/message'
import { error, warn } from '@/utils/logger'
import { getUserColor } from '@/utils/user'
import { toDateTimeStr } from '@/utils/date'

const route = useRoute()
const store = useSessionStore()
const contact = store.contacts.find((c) => c.address === route.params.address)
const msgList = ref<Message[]>([])
const inputText = ref<string>('')
const { currentUser } = store

if (!currentUser) {
    throw new Error('sign in needed')
}

if (!contact) {
    // TODO
    throw new Error('contact unknown')
}
const signaler = getSignaler(currentUser)
const messageHandler = (message: SignalMessage<'message'>) => {
    notice('info', message.payload)
    if (contact.address === message._from) {
        msgList.value.push(message)
    }
}
signaler.addEventListener('message', messageHandler)
onBeforeUnmount(() => {
    signaler.removeEventListener('message', messageHandler)
})

MessageModel.getHistoryWith(currentUser.address, contact.address).then(
    (messages) => {
        msgList.value = messages
    }
)

async function send() {
    if (!currentUser) {
        error(`not signed in`)
        return
    }

    if (!contact) {
        warn('send without currentContract')
        return
    }

    const message: Message = {
        id: newMessageId(),
        payload: inputText.value,
        timestamp: Date.now(),
        type: MessageType.Text,
        author: currentUser.address,
        from: currentUser.address,
        to: contact.address,
    }
    const msg = new MessageModel(currentUser.address, message)

    msgList.value.push(message)
    inputText.value = ''
    await signaler.send(contact.address, 'message', message)
    await msg.save()
}
</script>
<style scoped lang="scss">
@import '../../styles/base/variable';

.chat {
    background-color: #f1f1f1;
    height: 100vh;
    width: 100vw;
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
</style>