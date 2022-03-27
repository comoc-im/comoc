<template>
    <div class="comoc-web">
        <!--        <div class="panel">-->
        <!--            <div class="profile">-->
        <!--                <button type="button" @click="copyAddress">Copy Address</button>-->
        <!--                <button type="button" @click="addContact">Add Contact</button>-->
        <!--                <button type="button" @click="exportID">Export My ID</button>-->
        <!--                <button type="button" @click="store.signOut">Sign out</button>-->
        <!--            </div>-->
        <!--            <button type="button" class="preferences-btn" title="Preferences">-->
        <!--                <el-icon><setting /></el-icon>-->
        <!--            </button>-->
        <!--        </div>-->
        <!--        <div class="contacts">-->
        <!--            <div-->
        <!--                v-for="contact in contacts"-->
        <!--                :key="contact.address"-->
        <!--                :title="'chat with ' + contact.username"-->
        <!--                :class="{ active: activeContactID === contact.address }"-->
        <!--                class="contact"-->
        <!--                @click="selectContact(contact)"-->
        <!--            >-->
        <!--                {{ contact.username }}-->
        <!--            </div>-->
        <!--        </div>-->

        <!--        <div class="chat">-->
        <!--            <div class="chat-view">-->
        <!--                <div-->
        <!--                    v-for="msg in msgList"-->
        <!--                    :key="msg.id"-->
        <!--                    :style="{-->
        <!--                        color:-->
        <!--                            msg.author === activeContactID-->
        <!--                                ? contactColor()-->
        <!--                                : '',-->
        <!--                    }"-->
        <!--                    :class="[-->
        <!--                        'msg',-->
        <!--                        {-->
        <!--                            target: msg.author === activeContactID,-->
        <!--                            self: msg.author === currentUser.address,-->
        <!--                        },-->
        <!--                    ]"-->
        <!--                >-->
        <!--                    <p class="msg-content">{{ msg.payload }}</p>-->
        <!--                    <p class="msg-time">-->
        <!--                        {{ toDateTimeStr(msg.timestamp) }}-->
        <!--                    </p>-->
        <!--                </div>-->
        <!--            </div>-->
        <!--            <div class="chat-input">-->
        <!--                <textarea-->
        <!--                    v-model="inputText"-->
        <!--                    class="chat-textarea"-->
        <!--                    @keydown.enter.prevent="send"-->
        <!--                ></textarea>-->
        <!--                <button class="send-btn" type="button" @click="send">-->
        <!--                    Send-->
        <!--                </button>-->
        <!--            </div>-->
        <!--        </div>-->
        <van-list v-show="active === 0"> </van-list>
        <!-- contacts -->
        <van-index-bar v-show="active === 1">
            <van-index-anchor index="A" />
            <van-cell
                v-for="c in contacts"
                :key="c.address"
                :title="c.username.slice(0, 40)"
            />
        </van-index-bar>
        <!-- Preference -->
        <van-list v-show="active === 2">
            <van-cell-group inset title="Preference">
                <van-cell title="Cell title" value="Content" />
                <van-cell
                    title="Cell title"
                    value="Content"
                    label="Description"
                />
            </van-cell-group>
        </van-list>
        <van-tabbar v-model="active">
            <van-tabbar-item icon="chat">Message</van-tabbar-item>
            <van-tabbar-item icon="friends">Contact</van-tabbar-item>
            <van-tabbar-item icon="setting">Preference</van-tabbar-item>
        </van-tabbar>
    </div>
</template>
<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { Message, MessageModel, MessageType, newMessageId } from '@/db/message'
import { debug, error, warn } from '@/utils/logger'
import { fromAddress, stringify } from '@/id'
import { useSessionStore } from '@/store'
import { notice } from '@/utils/notification'
import { Contact, ContactModel } from '@/db/contact'
import { Address } from '@comoc-im/message'
import randomColor from 'randomcolor'
import { verifyPassword } from '@/db/user/crypto'
import { download } from '@/utils/file'
import { getSignaler, SignalMessage } from '@/network/signaler'
import { cPrompt } from '@/mobile/components'

const active = ref(0)
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
    const address = await cPrompt(
        `Paste new contact's address`,
        'New contact',
        'textarea'
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
    const _password = await cPrompt(
        'Enter password to export COMOC id file',
        'Password',
        'password'
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
@import '../../styles/base/variable';

.comoc-web {
    background-color: lightgrey;
    height: 100vh;
    width: 100vw;

    .van-tabbar {
        position: fixed;
    }
}
</style>
