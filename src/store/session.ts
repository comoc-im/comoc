import { User } from '@/db/user'
import { defineStore } from 'pinia'
import { SessionStorageKeys } from '@/constants'
import { router } from '@/router'
import { RouteName } from '@/router/routes'
import { closeSignaler, getSignaler } from '@/network/signaler'
import { info } from '@/utils/logger'

type SessionStore = {
    currentUser: User | null
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
        signIn(user: User) {
            this.currentUser = user
            window.sessionStorage.setItem(
                SessionStorageKeys.CurrentUser,
                JSON.stringify(user)
            )
            router.replace({ name: RouteName.Comoc })
            // listen for new messages
            const signaler = getSignaler(user.address)
            signaler.addEventListener('message', (message) => {
                info('receive message', message)
                message.save()
            })
        },
        signOut(): void {
            // signaler dispose
            if (this.currentUser?.address) {
                closeSignaler(this.currentUser.address)
            }
            window.sessionStorage.removeItem(SessionStorageKeys.CurrentUser)
            this.currentUser = null
            router.replace({ name: RouteName.SignIn })
        },
    },
})

// recover sessionStore from sessionStorage
export async function recoverSessionState(): Promise<void> {
    const sessionStore = useSessionStore()
    const cache = window.sessionStorage.getItem(SessionStorageKeys.CurrentUser)
    if (cache) {
        const user: User = JSON.parse(cache)
        sessionStore.signIn(user)
    }
}
