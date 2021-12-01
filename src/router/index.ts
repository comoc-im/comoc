import { RouteName, routes } from './routes'
import { createRouter, createWebHashHistory } from 'vue-router'
import store from '@/store'
import { warn } from '@/utils/logger'

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    if (to.name !== RouteName.SignIn && !store.getters.isSignedIn) {
        warn('redirect to sign in')
        next({ name: RouteName.SignIn })
        return
    }

    next()
})
// router.afterEach((to, from) => {});

export default router
