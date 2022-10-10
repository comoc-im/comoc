import { createApp } from 'vue'
import { RouterView } from 'vue-router'
import { isMobile } from '@/utils/ua'
import { recoverSessionState } from '@/views/common/store'
import { createPinia } from 'pinia'
import { router } from '@/views/common/router'
import './common/styles/index.scss'

const app = createApp(RouterView)

// Vue 开发选项
if (process.env.NODE_ENV !== 'production') {
    app.config.performance = true
}
if (process.env.NODE_ENV !== 'development') {
    app.config.errorHandler = (err, vm, info) => {
        if (vm !== null) {
            console.trace(`<${vm.$options.name}/> ${info} ${err}`)
        } else {
            console.trace(err, info)
        }
    }
}

/**
 * Vue SPA Start
 */
export async function startApp() {
    app.use(createPinia())
    app.use(router)

    if (isMobile()) {
        const { init } = await import('@/views/mobile')
        init(app)
    } else {
        const { init } = await import('@/views/desktop')
        init(app)
    }

    app.mount('#app')
    await recoverSessionState()
}
