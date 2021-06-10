<template>
    <div class="login">
        <div class="auth-lock">
            <p v-if="$store.getters.isSignedIn">
                already signed in, jumping now...
            </p>
            <form v-else @submit.prevent="submit">
                <label>
                    Username
                    <br />
                    <input
                        v-model.trim="username"
                        autocomplete="username"
                        name="username"
                        type="text"
                    />
                </label>
                <br />
                <br />
                <label>
                    Password
                    <br />
                    <input
                        v-model.trim="password"
                        autocomplete="current-password"
                        name="password"
                        type="text"
                        @keyup.enter="submit"
                    />
                </label>
                <br />
                <br />
                <input type="button" value="Sign Up" @click="create" />
                &nbsp;
                <input type="button" value="Sign In" @click="submit" />
            </form>
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import User from '@/db/user'
import { mutations } from '@/store/mutations'
import store from '@/store'
import { derivePasswordKey, generateKeyPair } from '@/db/user/crypto'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { info, log, warn } from '@/utils/logger'

export default defineComponent({
    name: 'sign-in',
    setup() {
        console.log('setup')
        const store = useStore()
        const router = useRouter()
        const username = ref('')
        const password = ref('')

        if (store.getters.isSignedIn) {
            router.replace({ name: 'comoc' })
        }

        return {
            username,
            password,
        }
    },
    methods: {
        create: async function () {
            if (this.username === '' || this.password === '') {
                warn('username and password necessary')
                ElMessage.warning('username and password necessary')
                return
            }

            const passwordHash = await derivePasswordKey(this.password)
            const keyPair = await generateKeyPair()
            const newUser = new User(this.username, passwordHash, keyPair)
            await newUser.save()
            ElMessage.success('user created')
            info(newUser)
        },
        async submit() {
            if (this.username === '' || this.password === '') {
                warn('username and password necessary')
                ElMessage.warning('username and password necessary')
                return
            }

            const user = await User.find(this.username, this.password)
            if (!user) {
                warn('user not found')
                ElMessage.warning('user not found')
                return
            }

            info('user found', user, this)
            store.commit(mutations.SET_CURRENT_USER, user)

            this.$router.replace({ name: 'comoc' })
        },
    },
})
</script>
<style lang="scss">
.login {
    .auth-lock {
        width: 200px;
        margin: 20vh auto 0;
        border-radius: 6px;
        padding: 2em 2em 3em;
        border: 1px solid lightgrey;
    }
}
</style>
