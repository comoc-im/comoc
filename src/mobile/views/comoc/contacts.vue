<template>
    <van-index-bar>
        <van-search v-model="keyword" placeholder="Placeholder" />
        <van-index-anchor index="A" />
        <van-cell
            v-for="c in contacts"
            :key="c.address"
            :title="c.username.slice(0, 40)"
        />
    </van-index-bar>
</template>
<script lang="ts" setup>
import { useSessionStore } from '@/store'
import { ref } from 'vue'

const store = useSessionStore()
const keyword = ref('')
const contacts = store.contacts.filter((c) => {
    c.username.includes(keyword.value)
})
</script>
