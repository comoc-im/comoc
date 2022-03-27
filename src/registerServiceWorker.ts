import { registerSW } from 'virtual:pwa-register'

registerSW({
    async onOfflineReady() {
        console.debug('Comoc PWA is ready')
    },
})
