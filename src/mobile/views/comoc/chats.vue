<template>
    <van-list class="chats">
        <van-cell v-for="m in chats" :key="m.id" :title="m.timestamp" />
    </van-list>
</template>
<script lang="ts" setup>
import { Message, MessageModel } from '@/db/message'
import { useSessionStore } from '@/store'
import { ref } from 'vue'

const store = useSessionStore()
const chats = ref<Message[]>([])

store.currentUser &&
    MessageModel.getRecentChats(store.currentUser.address).then((cs) => {
        chats.value = cs
    })
</script>
<style scoped></style>
