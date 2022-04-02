<template>
    <div class="contacts">
        <van-search v-model="keyword" placeholder="Placeholder" />
        <van-index-bar>
            <van-index-anchor index="A" />
            <van-cell
                v-for="c in contacts"
                :key="c.address"
                :title="c.username.slice(0, 40)"
            />
        </van-index-bar>
        <van-row>
            <van-col span="6" offset="9">
                <van-button
                    round
                    block
                    plain
                    icon="plus"
                    type="primary"
                    @click="addContact"
                />
            </van-col>
        </van-row>
    </div>
</template>
<script lang="ts" setup>
import { useSessionStore } from '@/store'
import { computed, ref } from 'vue'
import { cPrompt } from '@/mobile/components'
import { Notify, Toast } from 'vant'

const store = useSessionStore()
const keyword = ref('')
const contacts = computed(() =>
    store.contacts.filter((c) => c.username.includes(keyword.value))
)

async function addContact(): Promise<void> {
    const address = await cPrompt(
        `Paste new contact's address`,
        'New contact',
        'textarea'
    )
    store
        .addContact(address)
        .then(() => {
            Toast.success('OK')
        })
        .catch((err) => {
            Notify({ type: 'warning', message: err })
        })
}
</script>
<style scoped lang="scss">
.contacts {
    display: flex;
    flex-direction: column;

    .van-index-bar {
        flex: 1;
    }

    .van-button {
        margin: 1em 0;
    }
}
</style>
