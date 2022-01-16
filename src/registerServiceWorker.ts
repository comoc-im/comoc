import { registerSW } from 'virtual:pwa-register'
import { ElMessageBox } from 'element-plus/es'

registerSW({
    async onOfflineReady() {
        await ElMessageBox.alert('Comoc PWA is ready', '', {
            type: 'success',
            showClose: false,
        })
    },
})
