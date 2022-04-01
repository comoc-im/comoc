<template>
    <van-list class="preference">
        <van-cell-group inset title="Profile">
            <van-cell
                title="Username"
                :value="store.currentUser.username || '-/'"
            />
            <van-cell
                title="Cell title"
                clickable
                value="Description"
                label="Content"
            />
            <van-collapse v-model="activeNames">
                <van-collapse-item title="My address"
                    ><span class="address" @click="copyAddress">
                        {{
                            store.currentUser.address
                                .toUpperCase()
                                .match(/.{1,8}/g)
                                .join('\t')
                        }}
                    </span></van-collapse-item
                >
            </van-collapse>
        </van-cell-group>
    </van-list>
</template>
<script lang="ts" setup>
import { useSessionStore } from '@/store'
import { ref } from 'vue'
import { Toast } from 'vant'

const store = useSessionStore()
const activeNames = ref([])
const copyAddress = () =>
    store
        .copyAddress()
        .then(() => {
            Toast.success('Copied')
        })
        .catch((err) => {
            Toast.fail(String(err))
        })
</script>

<style scoped>
.address {
    font-family: monospace;
    user-select: none;
}
</style>
