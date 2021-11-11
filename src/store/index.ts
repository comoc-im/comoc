import { createLogger, createStore } from 'vuex'
import { mutations } from '@/store/mutations'
import { ComocID, getCurrentId } from '@/id'
import { debug } from '@/utils/logger'
import { SessionStorageKeys } from '@/constants'
import { User } from '@/db/user'

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
            window.sessionStorage.setItem(
                SessionStorageKeys.CurrentUser,
                JSON.stringify(user)
            )
        },
    },
    plugins: process.env.NODE_ENV !== 'production' ? [createLogger()] : [],
})

export async function recoverSessionState(): Promise<void> {
    const cache = window.sessionStorage.getItem(SessionStorageKeys.CurrentUser)
    if (cache) {
        const user: User = JSON.parse(cache)
        store.commit(mutations.SET_CURRENT_USER, user)
    }
    const id = await getCurrentId()
    if (id) {
        debug(`recover current id from session`)
        store.commit(mutations.SET_CURRENT_ID, id)
    }
}

export default store
