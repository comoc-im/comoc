<template>
    <div class="comoc-web">
        <div class="panel">
            <div class="profile">
                <button type="button" @click="copyAddress">Copy Address</button>
                <button type="button" @click="addContact">Add Contact</button>
                <button type="button" @click="exportID">Export My ID</button>
                <button type="button" @click="store.signOut">Sign out</button>
            </div>
            <button type="button" class="preferences-btn" title="Preferences">
                <el-icon><setting /></el-icon>
            </button>
        </div>
        <div class="contacts">
            <div
                v-for="contact in contacts"
                :key="contact.address"
                :title="'chat with ' + contact.username"
                :class="{ active: activeContactID === contact.address }"
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
                    :key="msg.id"
                    :style="{
                        color:
                            msg.author === activeContactID
                                ? contactColor()
                                : '',
                    }"
                    :class="[
                        'msg',
                        {
                            target: msg.author === activeContactID,
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
                <button class="send-btn" type="button" @click="send">
                    Send
                </button>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { Message, MessageModel, MessageType, newMessageId } from '@/db/message'
import { debug, error, warn } from '@/utils/logger'
import { fromAddress, stringify } from '@/id'
import { useSessionStore } from '@/store'
import { toDateTimeStr } from '@/utils/date'
import { notice } from '@/utils/notification'
import { Contact, ContactModel } from '@/db/contact'
import { Address } from '@comoc-im/message'
import randomColor from 'randomcolor'
import { verifyPassword } from '@/db/user/crypto'
import { download } from '@/utils/file'
import { getSignaler, SignalMessage } from '@/network/signaler'
import { ElMessageBox } from 'element-plus'

const store = useSessionStore()
const { currentUser } = store
const contacts = ref<Contact[]>([])
const activeContactID = ref<Address>('')
const inputText = ref<string>('')
const msgList = ref<Message[]>([])
const currentContact = computed(() =>
    contacts.value.find((c) => c.address === activeContactID.value)
)

if (!currentUser) {
    throw new Error('sign in needed')
}
const signaler = getSignaler(currentUser)
const messageHandler = (message: SignalMessage<'message'>) => {
    notice('info', message.payload)
    if (activeContactID.value === message._from) {
        msgList.value.push(message)
    }
}
signaler.addEventListener('message', messageHandler)
onBeforeUnmount(() => {
    signaler.removeEventListener('message', messageHandler)
})

refreshContacts(currentUser.address)

async function refreshContacts(owner: Address) {
    ContactModel.findAll(owner).then((cs) => (contacts.value = cs))
}

function contactColor(): string {
    return randomColor({
        seed: activeContactID.value,
        luminosity: 'dark',
    })
}

const copyAddress = () => navigator.clipboard.writeText(currentUser.address)

async function addContact(): Promise<void> {
    const { value: address } = await ElMessageBox.prompt(
        `Paste new contact's address`,
        'New contact'
    )
    if (!address) {
        notice('warn', `empty address`)
        return
    }
    const publicKey = await fromAddress(address)
    if (!publicKey) {
        notice('warn', `Invalid address`)
        return
    }

    if (!currentUser) {
        error(`not signed in`)
        return
    }

    const contact = new ContactModel(address as Address, currentUser.address)

    await contact.save()
    await refreshContacts(currentUser.address)
}

async function exportID(): Promise<void> {
    if (!currentUser) {
        return
    }
    const { value: _password } = await ElMessageBox.prompt(
        'Enter password to export COMOC id file',
        'Password',
        { inputType: 'password' }
    )
    const password = _password ? _password.trim() : ''
    if (!password) {
        return
    }

    const passwordCorrect = await verifyPassword(
        password,
        currentUser.passwordHash
    )
    if (!passwordCorrect) {
        notice('error', 'password wrong')
        return
    }

    download(
        await stringify({
            publicKey: currentUser.publicKey,
            privateKey: currentUser.privateKey,
        }),
        `${currentUser.username}.id`
    )
}

async function selectContact(contact: Contact) {
    debug('select contact', contact)
    activeContactID.value = contact.address

    if (!currentUser) {
        return
    }

    MessageModel.getHistoryWith(currentUser.address, contact.address).then(
        (messages) => {
            msgList.value = messages
        }
    )
}

async function send() {
    if (!currentUser) {
        error(`not signed in`)
        return
    }

    if (!currentContact.value) {
        warn('send without currentContract')
        return
    }
    const message: Message = {
        id: newMessageId(),
        payload: inputText.value,
        timestamp: Date.now(),
        type: MessageType.Text,
        author: currentUser.address,
    }
    const msg = new MessageModel({
        from: currentUser.address,
        to: currentContact.value.address,
        owner: currentUser.address,
        message,
    })

    msgList.value.push(message)
    inputText.value = ''
    await signaler.send(currentContact.value.address, 'message', message)
    await msg.save()
}
</script>
<style lang="scss" scoped>
@import '../styles/base/variable';

.comoc-web {
    display: flex;
    height: 100vh;

    .panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 1em;
        max-width: 80px;
        border-right: 1px solid lightgrey;

        .preferences-btn {
            font-size: 18px;
            padding: 2px;
            line-height: 0;
        }
    }

    .contacts {
        min-width: 15vw;
        max-width: 300px;

        .contact {
            word-break: break-all;
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
