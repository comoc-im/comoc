import { RouteRecordRaw } from 'vue-router'
import { isMobile } from '@/utils/ua'

export enum RouteName {
    SignIn = 'signIn',
    Comoc = 'comoc',
    Chat = 'chat',
}
export const routes: RouteRecordRaw[] = isMobile()
    ? [
          {
              path: '/sign_in',
              name: RouteName.SignIn,
              component: () => import('@/mobile/views/sign-in.vue'),
          },
          {
              path: '/comoc',
              name: RouteName.Comoc,
              component: () => import('@/mobile/views/comoc.vue'),
          },
          {
              path: '/chat/:address',
              name: RouteName.Chat,
              component: () => import('@/mobile/views/chat.vue'),
          },
          {
              path: '/:pathMatch(.*)*',
              redirect: { name: RouteName.SignIn },
          },
      ]
    : [
          {
              path: '/sign_in',
              name: RouteName.SignIn,
              component: () => import('@/desktop/views/sign-in.vue'),
          },
          {
              path: '/comoc',
              name: RouteName.Comoc,
              component: () => import('@/desktop/views/comoc.vue'),
          },
          {
              path: '/:pathMatch(.*)*',
              redirect: { name: RouteName.SignIn },
          },
      ]
