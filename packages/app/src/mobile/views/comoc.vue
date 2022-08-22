<template>
    <div class="comoc-web">
        <!--        <div class="panel">-->
        <!--            <div class="profile">-->
        <!--                <button type="button" @click="exportID">Export My ID</button>-->
        <!--                <button type="button" @click="store.signOut">Sign out</button>-->
        <!--            </div>-->
        <!--        </div>-->

        <!--        <div class="chat">-->

        <!--        </div>-->
        <chats v-show="active === 0" />
        <!-- contacts -->
        <contacts v-show="active === 1" />
        <!-- Preference -->
        <preference v-show="active === 2" />
        <van-tabbar v-model="active" :fixed="false">
            <van-tabbar-item icon="chat">Message</van-tabbar-item>
            <van-tabbar-item icon="friends">Contact</van-tabbar-item>
            <van-tabbar-item icon="setting">Preference</van-tabbar-item>
        </van-tabbar>
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { useSessionStore } from '@/store'
import Contacts from './comoc/contacts.vue'
import Preference from '@/mobile/views/comoc/preference.vue'
import Chats from '@/mobile/views/comoc/chats.vue'

const active = ref(0)
const store = useSessionStore()
const { currentUser } = store

if (!currentUser) {
    throw new Error('sign in needed')
}

store.refreshContacts()

// async function exportID(): Promise<void> {
//     if (!currentUser) {
//         return
//     }
//     const _password = await cPrompt(
//         'Enter password to export COMOC id file',
//         'Password',
//         'password'
//     )
//     const password = _password ? _password.trim() : ''
//     if (!password) {
//         return
//     }
//
//     const passwordCorrect = await verifyPassword(
//         password,
//         currentUser.passwordHash
//     )
//     if (!passwordCorrect) {
//         notice('error', 'password wrong')
//         return
//     }
//
//     download(
//         await stringify({
//             publicKey: currentUser.publicKey,
//             privateKey: currentUser.privateKey,
//         }),
//         `${currentUser.username}.id`
//     )
// }
</script>
<style lang="scss" scoped>
@import '../../styles/base/variable';

.comoc-web {
    background-color: lightgrey;
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;

    .chats {
        flex: 1;
    }

    .contacts {
        flex: 1;
    }

    .preference {
        flex: 1;
    }
}
</style>
