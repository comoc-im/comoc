import routes from './routes'
import { createRouter, createWebHashHistory } from 'vue-router'
import store from '@/store'

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    if (to.name !== 'signIn' && !store.getters.isSignedIn) {
        console.warn('redirect to sign in')
        next({ name: 'signIn' })
        return
    }

    next()
})
// router.afterEach((to, from) => {});

export default router
