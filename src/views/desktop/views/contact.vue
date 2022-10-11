<template>
    <div class="contacts">
        <div
            v-for="contact in store.contacts"
            :key="contact.address"
            :title="'chat with ' + contact.username"
            :class="{ active: activeContactID === contact.address }"
            class="contact"
            @click="selectContact(contact)"
        >
            {{ contact.username }}
        </div>
        <el-button type="success" round :icon="Plus" @click="addContact"
            >Export</el-button
        >
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { todo } from '@/utils/logger'
import { useSessionStore } from '@/views/common/store'
import { Contact } from '@/db/contact'
import { Address } from '@comoc-im/id'
import { ElButton, ElMessage, ElMessageBox } from 'element-plus'
import { notice } from '@/utils/notification'
import { Plus } from '@element-plus/icons-vue'

const store = useSessionStore()
const activeContactID = ref<Address>('')

store.refreshContacts()

async function selectContact(contact: Contact) {
    todo('select contact', contact)
}
async function addContact(): Promise<void> {
    const { value: address } = await ElMessageBox.prompt(
        `Paste new contact's address`,
        'New contact'
    )

    store
        .addContact(address)
        .then(() => {
            ElMessage({
                message: 'A new friend 🎉',
                type: 'success',
            })
        })
        .catch((err) => {
            notice('warn', err)
        })
}
</script>
<style lang="scss">
@import '../../common/styles/base/variable';

.contacts {
    .contact {
        word-break: break-all;
        padding: 12px;
        cursor: pointer;

        &:hover {
            background-color: lightblue;
        }

        &:active,
        &.active {
            color: white;
            background-color: deepskyblue;
        }

        ~ .contact {
            border-top: $border-color;
        }
    }
}
</style>
