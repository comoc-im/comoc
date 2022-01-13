import { defineStore } from 'pinia'
import { SessionStorageKeys } from '@/constants'
import { router } from '@/router'
import { RouteName } from '@/router/routes'
import { closeSignaler, getSignaler } from '@/network/signaler'
import { Address } from '@comoc-im/message'
import { parse, stringify, toAddress } from '@/id'
import { MessageModel } from '@/db/message'
import { info } from '@/utils/logger'

export type SessionUser = {
    username: string
    address: Address
    passwordHash: string
    publicKey: CryptoKey
    privateKey: CryptoKey
}

type SessionStore = {
    currentUser: SessionUser | null
}

export const useSessionStore = defineStore('session', {
    state: (): SessionStore => ({
        currentUser: null,
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
                SessionStorageKeys.CurrentUser,
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
                await new MessageModel({
                    from: message._from,
                    to: message._to,
                    owner: user.address,
                    message: {
                        author: message._from,
                        id: message.id,
                        type: message.type,
                        timestamp: message.timestamp,
                        payload: message.payload,
                    },
                }).save()
            })
        },
        async signOut(): Promise<void> {
            // signaler dispose
            if (this.currentUser) {
                closeSignaler()
            }
            window.sessionStorage.removeItem(SessionStorageKeys.CurrentUser)
            this.currentUser = null
            await router.replace({ name: RouteName.SignIn })
        },
    },
})

// recover sessionStore from sessionStorage
export async function recoverSessionState(): Promise<void> {
    const sessionStore = useSessionStore()
    const cache = window.sessionStorage.getItem(SessionStorageKeys.CurrentUser)
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
            const idCache = await parse(id)
            if (idCache) {
                sessionStore.signIn({
                    username,
                    address: await toAddress(idCache.publicKey),
                    passwordHash,
                    privateKey: idCache.privateKey,
                    publicKey: idCache.publicKey,
                })
            } else {
                window.sessionStorage.removeItem(SessionStorageKeys.CurrentUser)
            }
        } catch (err) {
            window.sessionStorage.removeItem(SessionStorageKeys.CurrentUser)
        }
    }
}
