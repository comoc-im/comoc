<template>
    <div class="login">
        <div class="auth-lock">
            <p v-if="$store.getters.isSignedIn">
                already signed in, jumping now...
            </p>
            <form v-else>
                <template v-if="!$store.state.currentId">
                    <label>
                        Username
                        <br />
                        <input
                            v-model.trim="username"
                            autocomplete="username"
                            name="username"
                            type="text"
                            @keydown.enter.prevent="create"
                        />
                    </label>
                    <br />
                    <br />
                    <input
                        type="button"
                        value="Create Comoc ID"
                        @click="create"
                    />
                </template>
                <template v-else>
                    <label>
                        Password
                        <br />
                        <input
                            v-model.trim="password"
                            autocomplete="current-password"
                            name="password"
                            type="password"
                            @keydown.enter.prevent="signIn"
                        />
                    </label>
                    <br />
                    <br />
                    <input type="button" value="Sign In" @click="signIn" />
                </template>
            </form>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { error, todo, warn } from '@/utils/logger'
import { download } from '@/utils/file'
import { createId, setCurrentId, stringify, wrapPrivateKey } from '@/id'
import { mutations } from '@/store/mutations'
import { CommonStore } from '@/store'
import { SessionStorageKeys } from '@/constants'
import { createUser } from '@/db/user'
import { notice } from '@/utils/notification'

const usernameCache =
    window.sessionStorage.getItem(SessionStorageKeys.Username) || ''
const store = useStore<CommonStore>()
const router = useRouter()
const username = ref(usernameCache)
const password = ref('')

function goToComoc() {
    window.sessionStorage.removeItem(SessionStorageKeys.Username)
    router.replace({ name: 'comoc' })
}

async function create() {
    if (username.value === '') {
        warn('username necessary')
        notice('warn', 'username necessary')
        return
    }

    try {
        const id = await createId()
        download(await stringify(id), `${username.value}.id`)
        store.commit(mutations.SET_CURRENT_ID, id)
        setCurrentId(id)
    } catch (err) {
        error(`create fail, ${err}`)
        notice('error', `create fail, ${err}`)
    }

    // const passwordHash = await derivePasswordKey(this.password)
    // const newUser = new User(this.username, passwordHash, keyPair)
    // await newUser.save()
    // ElMessage.success('user created')
    // info(newUser)
}

async function signIn() {
    if (!store.state.currentId) {
        warn('no comoc id')
        notice('warn', 'no comoc id')
        return
    }
    if (password.value === '') {
        warn('password necessary')
        notice('warn', 'password necessary')
        return
    }

    try {
        const wrappedPrivateKey = await wrapPrivateKey(
            password.value,
            store.state.currentId.privateKey
        )

        // TODO send public key, username, and a private key signed sign-in-req to Beacon server
        // await signIn(publicK, username.value, )
        todo('sign in to Beacon server')

        const user = await createUser(
            username.value,
            password.value,
            store.state.currentId.publicKey,
            wrappedPrivateKey
        )
        store.commit(mutations.SET_CURRENT_USER, user)
        goToComoc()
    } catch (err) {
        error(`sign in fail, ${err}`)
        notice('error', `sign in fail, ${err}`)
    }
}

if (store.getters.isSignedIn) {
    goToComoc()
} else {
    watch(username, (newName, oldName) => {
        if (newName !== oldName) {
            window.sessionStorage.setItem(SessionStorageKeys.Username, newName)
        }
    })
}

// async submit() {
//     if (this.username === '' || this.password === '') {
//         warn('username and password necessary')
//         ElMessage.warning('username and password necessary')
//         return
//     }
//
//     const user = await User.find(this.username, this.password)
//     if (!user) {
//         warn('user not found')
//         ElMessage.warning('user not found')
//         return
//     }
//
//     info('user found', user, this)
//     store.commit(mutations.SET_CURRENT_USER, user)
//
//     this.$router.replace({ name: 'comoc' })
// },
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
