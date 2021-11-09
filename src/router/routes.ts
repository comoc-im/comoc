import store from '@/store'

const signIn = () => import('../views/sign-in.vue')
const Comoc = () => import('../views/comoc.vue')

export default [
    { path: '/sign_in', name: 'signIn', component: signIn },
    {
        path: '/comoc',
        name: 'comoc',
        component: Comoc,
        props: { currentUser: store.state.currentUser },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'catchAll',
        redirect: { name: 'signIn' },
    },
]
