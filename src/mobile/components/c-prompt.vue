<template>
    <van-dialog
        :show="show"
        :title="$props.title"
        :message="$props.message"
        show-cancel-button
        @cancel="$props.onCancel"
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
<script lang="ts" setup>
import { defineProps, onMounted, ref } from 'vue'
import { Field, FieldType } from 'vant'

interface Props {
    message: string
    title: string
    type: FieldType
    onCancel: () => void
    onConfirm: (v: string) => void
}

defineProps<Props>()

const show = ref(true)
const value = ref('')
const field = ref<typeof Field | null>(null)

onMounted(() => {
    field.value?.focus()
})
</script>
