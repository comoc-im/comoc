import { RouteName, routes } from './routes'
import { createRouter, createWebHashHistory } from 'vue-router'
import { useSessionStore } from '@/store'
import { warn } from '@/utils/logger'

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    const sessionStore = useSessionStore()
    if (to.name !== RouteName.SignIn && !sessionStore.isSignedIn) {
        warn('redirect to sign in')
        next({ name: RouteName.SignIn })
        return
    }

    if (to.name === RouteName.SignIn && sessionStore.isSignedIn) {
        warn('redirect to comoc')
        next({ name: RouteName.Comoc })
        return
    }

    next()
})
// router.afterEach((to, from) => {});

export { router }
