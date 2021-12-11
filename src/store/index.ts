import { ComocID, getCurrentId } from '@/id'
import { debug } from '@/utils/logger'
import { SessionStorageKeys } from '@/constants'
import { User } from '@/db/user'
import Socket from '@/network/signaler/websocket'
import { WebRTCChannel } from '@/network/channel/webrtc'
import { defineStore } from 'pinia'

export type CommonStore = {
    currentId: ComocID | null
    currentUser: User | null
}

export const useSessionStore = defineStore('session', {
    state: (): CommonStore => ({
        currentId: null,
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
            const signaler = new Socket(user.address)
            WebRTCChannel.init(user.address, signaler)
        },
    },
})

export async function recoverSessionState(): Promise<void> {
    const sessionStore = useSessionStore()
    const cache = window.sessionStorage.getItem(SessionStorageKeys.CurrentUser)
    if (cache) {
        const user: User = JSON.parse(cache)
        sessionStore.signIn(user)
    }
    const id = await getCurrentId()
    if (id) {
        debug(`recover current id from session`)
        sessionStore.currentId = id
    }
}
