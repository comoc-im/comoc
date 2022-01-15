import { registerSW } from 'virtual:pwa-register'
import { ElMessageBox } from 'element-plus/es'

const updateSW = registerSW({
    async onOfflineReady() {
        // const div = document.createElement('div')
        //
        // div.style.position = 'absolute'
        // div.style.left = '0'
        // div.style.top = '0'
        // div.style.right = '0'
        // div.style.bottom = '0'
        // document.body.appendChild(div)
        await ElMessageBox.confirm(
            'Delete local user will remove all local data, you sure?'
        )
    },
})
