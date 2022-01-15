import { createApp } from 'vue'
import { RouterView } from 'vue-router'
import './styles/index.scss'
import { router } from './router'
import { recoverSessionState } from './store'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { Setting } from '@element-plus/icons-vue'
import './registerServiceWorker'

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
    app.component(Setting.name, Setting)
    app.use(ElementPlus)
    app.use(createPinia())
    app.use(router)
    app.mount('#app')

    await recoverSessionState()
})()
