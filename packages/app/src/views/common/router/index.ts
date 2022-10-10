import { RouteName, routes } from './routes'
import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/views/common/store'
import { warn } from '@/utils/logger'

const router = createRouter({
    history: createWebHistory(),
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
