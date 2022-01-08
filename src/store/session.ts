import { User } from '@/db/user'
import { defineStore } from 'pinia'
import { SessionStorageKeys } from '@/constants'
import { router } from '@/router'
import { RouteName } from '@/router/routes'

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
        },
        signOut(): void {
            this.currentUser = null
            window.sessionStorage.removeItem(SessionStorageKeys.CurrentUser)
            // TODO
            //  signaler dispose
            //  WebRTCChannel dispose
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
