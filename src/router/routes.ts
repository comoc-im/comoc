import { RouteRecordRaw } from 'vue-router'

const signIn = () => import('../views/sign-in.vue')
const Comoc = () => import('../views/comoc.vue')

export enum RouteName {
    SignIn = 'signIn',
    Comoc = 'comoc',
}
export const routes: RouteRecordRaw[] = [
    { path: '/sign_in', name: RouteName.SignIn, component: signIn },
    {
        path: '/comoc',
        name: RouteName.Comoc,
        component: Comoc,
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: { name: RouteName.SignIn },
    },
]
