<template>
    <van-list class="chats">
        <van-cell
            v-for="m in chats"
            title="Cell title"
            :key="m.id"
            :value="toDateTimeStr(m.timestamp)"
            :label="m.payload"
        />
    </van-list>
</template>
<script lang="ts" setup>
import { Message, MessageModel } from '@/db/message'
import { useSessionStore } from '@/store'
import { ref } from 'vue'
import { toDateTimeStr } from '@/utils/date'

const store = useSessionStore()
const chats = ref<Message[]>([])

store.currentUser &&
    MessageModel.getRecentChats(store.currentUser.address).then((cs) => {
        chats.value = cs
        console.log(cs)
    })
</script>
<style scoped></style>
