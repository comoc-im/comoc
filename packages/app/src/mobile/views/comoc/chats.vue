<template>
    <van-list class="chats">
        <van-cell
            v-for="m in chats"
            title="Cell title"
            :key="m.id"
            :value="toDateTimeStr(m.timestamp)"
            :label="m.payload"
            @click="enterChatWith(m)"
        />
    </van-list>
</template>
<script lang="ts" setup>
import { Message, MessageModel } from '@/db/message'
import { useSessionStore } from '@/store'
import { ref } from 'vue'
import { toDateTimeStr } from '@/utils/date'
import { router } from '@/router'
import { RouteName } from '@/router/routes'

const store = useSessionStore()
const chats = ref<Message[]>([])

store.currentUser &&
    MessageModel.getRecentChats(store.currentUser.address).then((cs) => {
        chats.value = cs
        console.log(cs)
    })

function enterChatWith(m: Message): void {
    const address = m.from === store.currentUser?.address ? m.to : m.from
    router.push({
        name: RouteName.Chat,
        params: {
            address,
        },
    })
}
</script>
<style scoped></style>
