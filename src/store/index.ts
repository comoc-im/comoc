import { createLogger, createStore } from 'vuex'
import { mutations } from '@/store/mutations'
import { ComocID, getCurrentId, setCurrentId } from '@/id'
import { debug } from '@/utils/logger'
import { SessionStorageKeys } from '@/constants'
import { User } from '@/db/user'

export type commonStore = {
    currentId: ComocID | null
    currentUser: User | null
}

const store = createStore<commonStore>({
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
            setCurrentId(id)
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

getCurrentId().then((id) => {
    if (id) {
        debug(`recover current id from session`)
        store.commit(mutations.SET_CURRENT_ID, id)
    }
})

const cache = window.sessionStorage.getItem(SessionStorageKeys.CurrentUser)
if (cache) {
    const user: User = JSON.parse(cache)
    store.commit(mutations.SET_CURRENT_USER, user)
}

export default store
