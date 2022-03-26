<template>
    <van-dialog
        :show="show"
        :title="$props.title"
        :message="$props.message"
        show-cancel-button
        @cancel="$props.onCancel()"
        @confirm="$props.onConfirm(value)"
    >
        <van-cell-group inset>
            <van-cell>
                <van-field
                    ref="field"
                    v-model="value"
                    :type="$props.type"
                    clearable
                    input-align="center"
                />
            </van-cell>
        </van-cell-group>
    </van-dialog>
</template>
<script lang="ts">
import { createApp, defineComponent, onMounted, ref } from 'vue'
import { Cell, CellGroup, Dialog, Field } from 'vant'

const Prompt = defineComponent({
    props: {
        message: String,
        title: String,
        type: String,
        onCancel: Function,
        onConfirm: Function,
    },
    setup() {
        const show = ref(true)
        const value = ref('')
        const field = ref<typeof Field | null>(null)
        onMounted(() => {
            field.value?.focus()
        })
        return {
            show,
            value,
            field,
        }
    },
})

export default Prompt

export function cPrompt(
    message: string,
    title: string,
    type: 'text' | 'password' | 'textarea' = 'text'
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
</script>
