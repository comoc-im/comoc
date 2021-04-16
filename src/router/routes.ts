import { Component } from '@vue/runtime-core'

const signIn = (): Promise<Component> =>
    import(
        /* webpackChunkName: "about", prefetch: true */ '../views/sign-in.vue'
    )
const Comoc = (): Promise<Component> =>
    import(/* webpackChunkName: "about", prefetch: true */ '../views/comoc.vue')

export default [
    { path: '/sign_in', name: 'signIn', component: signIn },
    { path: '/comoc', name: 'comoc', component: Comoc },
    {
        path: '/:pathMatch(.*)*',
        name: 'catchAll',
        redirect: { name: 'signIn' },
    },
]
