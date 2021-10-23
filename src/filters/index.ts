import { Plugin } from 'vue'
import { App } from '@vue/runtime-core'

export const filters: Plugin = {
    install(app: App) {
        app.config.globalProperties.$filters = {
            toDateTimeStr(timestamp: number): string {
                return new Date(timestamp).toLocaleString()
            },
        }
    },
}
