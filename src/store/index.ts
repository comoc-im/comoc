import {createLogger, createStore} from 'vuex'
import User from "@/db/user";
import {mutations} from "@/store/mutations";

export type commonStore = {
    currentUser: User | { [index: string]: never };
}

const USER_SESSION_KEY = 'USER_SESSION_KEY'

const store = createStore<commonStore>({
    strict: true,
    state () {
        return {
            currentUser: {}
        }
    },
    getters: {
        isSignedIn(state): boolean {
            return !!state.currentUser.username
        }
    },
    mutations: {
        [mutations.SET_CURRENT_USER] (state, user: User) {
            state.currentUser = user
            window.sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user))
        }
    },
    plugins: process.env.NODE_ENV !== 'production'
        ? [createLogger()]
        : []
})

const cache = window.sessionStorage.getItem(USER_SESSION_KEY)
if (cache) {
    const user: User = JSON.parse(cache)
    store.commit(mutations.SET_CURRENT_USER, user)
}


export default store;
