import { defineStore } from 'pinia'
import { LocalStorageKeys } from '@/constants'
import { router } from '@/router'
import { RouteName } from '@/router/routes'
import { closeSignaler, getSignaler } from '@/network/signaler'
import { Address, fromAddress, importId, toAddress } from '@comoc-im/id'
import { stringify } from '@/id'
import { MessageModel } from '@/db/message'
import { info, warn } from '@/utils/logger'
import { Contact, ContactModel } from '@/db/contact'
import { copy } from '@/utils/clipboard'

export type SessionUser = {
    username: string
    address: Address
    passwordHash: string
    publicKey: CryptoKey
    privateKey: CryptoKey
}

type SessionStore = {
    currentUser: SessionUser | null
    contacts: Contact[]
}

export const useSessionStore = defineStore('session', {
    state: (): SessionStore => ({
        currentUser: null,
        contacts: [],
    }),
    getters: {
        isSignedIn(state): boolean {
            return !!state.currentUser
        },
    },
    actions: {
        async signIn(user: SessionUser): Promise<void> {
            this.currentUser = user
            window.sessionStorage.setItem(
                LocalStorageKeys.CurrentUser,
                JSON.stringify({
                    username: user.username,
                    passwordHash: user.passwordHash,
                    id: await stringify({
                        privateKey: user.privateKey,
                        publicKey: user.publicKey,
                    }),
                })
            )
            await router.replace({ name: RouteName.Comoc })
            // listen for new messages
            const signaler = getSignaler(user)
            signaler.addEventListener('message', async (message) => {
                info('receive message', message)
                await new MessageModel(user.address, {
                    author: message.from,
                    from: message.from,
                    to: message.to,
                    id: message.id,
                    type: message.type,
                    timestamp: message.timestamp,
                    payload: message.payload,
                }).save()
            })
        },
        async signOut(): Promise<void> {
            // signaler dispose
            if (this.currentUser) {
                closeSignaler()
            }
            window.sessionStorage.removeItem(LocalStorageKeys.CurrentUser)
            this.currentUser = null
            await router.replace({ name: RouteName.SignIn })
        },
        async refreshContacts() {
            if (!this.currentUser) {
                warn('refreshContacts not logged in')
                return
            }
            return ContactModel.findAll(this.currentUser.address).then((cs) => {
                this.contacts = cs
            })
        },
        async addContact(address: Address): Promise<void> {
            const _address = address.trim()
            if (_address === '') {
                throw `empty address`
            }

            if (!this.currentUser) {
                throw `not signed in`
            }

            if (_address === this.currentUser.address) {
                throw `You can't add yourself`
            }

            const publicKey = await fromAddress(_address)
            if (!publicKey) {
                throw `Invalid address`
            }

            const contact = new ContactModel(_address, this.currentUser.address)
            await contact.save()
            await this.refreshContacts()
        },
        async copyAddress() {
            if (!this.currentUser) {
                throw `not signed in`
            }
            return copy(this.currentUser.address)
        },
    },
})

// recover sessionStore from sessionStorage
export async function recoverSessionState(): Promise<void> {
    const sessionStore = useSessionStore()
    const cache = window.sessionStorage.getItem(LocalStorageKeys.CurrentUser)
    if (cache) {
        try {
            const {
                username,
                passwordHash,
                id,
            }: {
                username: string
                passwordHash: string
                id: string
            } = JSON.parse(cache)
            const idCache = await importId(id)
            if (idCache) {
                sessionStore.signIn({
                    username,
                    address: await toAddress(idCache.publicKey),
                    passwordHash,
                    privateKey: idCache.privateKey,
                    publicKey: idCache.publicKey,
                })
            } else {
                window.sessionStorage.removeItem(LocalStorageKeys.CurrentUser)
            }
        } catch (err) {
            window.sessionStorage.removeItem(LocalStorageKeys.CurrentUser)
        }
    }
}
