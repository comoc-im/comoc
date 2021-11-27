import { createLogger, createStore } from 'vuex'
import { mutations } from '@/store/mutations'
import { ComocID, getCurrentId } from '@/id'
import { debug } from '@/utils/logger'
import { SessionStorageKeys } from '@/constants'
import { User } from '@/db/user'
import { Actions } from '@/store/actions'
import Socket from '@/network/signaler/websocket'
import { WebRTCChannel } from '@/network/channel/webrtc'

export type CommonStore = {
    currentId: ComocID | null
    currentUser: User | null
}

const store = createStore<CommonStore>({
    strict: true,
    state() {
        return {
            currentId: null,
            currentUser: null,
        }
    },
    getters: {
        isSignedIn(state): boolean {
            return !!state.currentUser
        },
    },
    mutations: {
        [mutations.SET_CURRENT_ID](state, id: ComocID) {
            state.currentId = id
        },
        [mutations.SET_CURRENT_USER](state, user: User) {
            state.currentUser = user
        },
    },
    actions: {
        [Actions.SIGN_IN]({ commit }, user: User) {
            commit(mutations.SET_CURRENT_USER, user)
            window.sessionStorage.setItem(
                SessionStorageKeys.CurrentUser,
                JSON.stringify(user)
            )
            const signaler = new Socket(user.address)
            WebRTCChannel.init(user.address, signaler)
        },
    },
    plugins: process.env.NODE_ENV !== 'production' ? [createLogger()] : [],
})

export async function recoverSessionState(): Promise<void> {
    const cache = window.sessionStorage.getItem(SessionStorageKeys.CurrentUser)
    if (cache) {
        const user: User = JSON.parse(cache)
        store.dispatch(Actions.SIGN_IN, user)
    }
    const id = await getCurrentId()
    if (id) {
        debug(`recover current id from session`)
        store.commit(mutations.SET_CURRENT_ID, id)
    }
}

export default store
