import 'webrtc-adapter/out/adapter_no_global'
import 'core-js/stable'
import { createApp } from 'vue'
import { RouterView } from 'vue-router'
import './styles/index.scss'
import router from './router'
import store, { recoverSessionState } from './store'
import dbReady from '@/db'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTools } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faTools)

// import './registerServiceWorker'
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
    await dbReady
    await recoverSessionState()

    app.component('fas-icon', FontAwesomeIcon)
    app.use(store)
    app.use(router)
    app.mount('#app')
})()
