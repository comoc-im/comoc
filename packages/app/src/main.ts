import { createApp } from 'vue'
import { RouterView } from 'vue-router'
import './styles/index.scss'
import { recoverSessionState } from './store'
import { createPinia } from 'pinia'
import './registerServiceWorker'
import { isMobile } from '@/utils/ua'
import { router } from '@/router'

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
;(async () => {
    app.use(createPinia())
    app.use(router)
    if (isMobile()) {
        const { init } = await import('@/mobile')
        init(app)
    } else {
        const { init } = await import('@/desktop')
        init(app)
    }

    app.mount('#app')
    await recoverSessionState()
})()
