import {createLogger, createStore} from 'vuex'

export default createStore({
    state() {
        return {}
    },
    mutations: {},
    plugins: process.env.NODE_ENV !== 'production'
        ? [createLogger()]
        : []
})
