<template>
    <div class="login">
        <div class="auth-lock">
            <p v-if="$store.getters.isSignedIn">
                already signed in, jumping now...
            </p>
            <button type="button" @click="connect">Connect Wallet</button>
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { debug } from '@/utils/logger'
import { connect } from '@/auth'
import store from '@/store'
import { mutations } from '@/store/mutations'

export default defineComponent({
    name: 'sign-in',
    setup() {
        debug('setup')
        const store = useStore()
        const router = useRouter()

        if (store.getters.isSignedIn) {
            router.replace({ name: 'comoc' })
        }
    },
    methods: {
        async connect() {
            // warn('username and password necessary')
            // ElMessage.warning('username and password necessary')
            const account = await connect()
            if (account) {
                store.commit(mutations.SET_CURRENT_ACCOUNT, account)
            }

            // const user = await User.find(this.username, this.password)
            // if (!user) {
            //     warn('user not found')
            //     ElMessage.warning('user not found')
            //     return
            // }

            // info('user found', account, this)
            // store.commit(mutations.SET_CURRENT_USER, account)

            // this.$router.replace({ name: 'comoc' })
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
