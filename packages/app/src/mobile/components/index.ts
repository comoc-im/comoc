import { createApp } from 'vue'
import { Cell, CellGroup, Dialog, Field, FieldType } from 'vant'
import Prompt from '@/mobile/components/c-prompt.vue'

export function cPrompt(
    message: string,
    title: string,
    type: FieldType = 'text'
): Promise<string> {
    const root = document.createElement('div')
    document.body.appendChild(root)

    return new Promise<string>(function (resolve, reject) {
        const app = createApp(Prompt, {
            message,
            title,
            type,
            onCancel: () => {
                unmount()
                reject()
            },
            onConfirm: (v: string) => {
                unmount()
                resolve(v)
            },
        })
        app.use(Dialog)
        app.use(Cell)
        app.use(CellGroup)
        app.use(Field)

        function unmount() {
            app.unmount()
            document.body.removeChild(root)
        }

        app.mount(root)
    })
}
