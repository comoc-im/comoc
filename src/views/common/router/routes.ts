import { RouteRecordRaw } from 'vue-router'
import { isMobile } from '@/utils/ua'

export enum RouteName {
    SignIn = 'signIn',
    Comoc = 'comoc',
    Chat = 'chat',
    Contact = 'contact',
    Preference = 'preference',
}
export const routes: RouteRecordRaw[] = isMobile()
    ? [
          {
              path: '/sign_in',
              name: RouteName.SignIn,
              component: () => import('@/views/mobile/views/sign-in.vue'),
          },
          {
              path: '/comoc',
              name: RouteName.Comoc,
              component: () => import('@/views/mobile/views/comoc.vue'),
          },
          {
              path: '/chat/:address',
              name: RouteName.Chat,
              component: () => import('@/views/mobile/views/chat.vue'),
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
              component: () => import('@/views/desktop/views/sign-in.vue'),
          },
          {
              path: '/comoc',
              name: RouteName.Comoc,
              component: () => import('@/views/desktop/views/comoc.vue'),
              children: [
                  {
                      name: RouteName.Chat,
                      path: 'chat/:address?',
                      component: () => import('@/views/desktop/views/chat.vue'),
                  },
                  {
                      name: RouteName.Contact,
                      path: 'contact',
                      component: () =>
                          import('@/views/desktop/views/contact.vue'),
                  },
                  {
                      name: RouteName.Preference,
                      path: 'preference',
                      component: () =>
                          import('@/views/desktop/views/preference.vue'),
                  },
              ],
          },
          {
              path: '/:pathMatch(.*)*',
              redirect: { name: RouteName.SignIn },
          },
      ]
