<template>
    <div class="login">
        <div class="auth-lock">
            <p v-if="store.getters.isSignedIn">
                already signed in, jumping now...
            </p>
            <div v-else-if="localUsers.length !== 0">
                <p>Sign in with previous ID</p>
                <a
                    class="local-user"
                    v-for="user in localUsers"
                    :key="user.address"
                    @click="signInWithPreviousId(user)"
                    :title="'Sign in with ' + user.username"
                    >{{ user.username || user.address }}</a
                >
                <br />
                <br />
                <hr />
                Or create new ID
                <br />
                <button type="button" @click="localUsers = []">sign up</button>
            </div>
            <form v-else>
                <template v-if="!store.state.currentId">
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
import { debug, error, todo, warn } from '@/utils/logger'
import { createId, setCurrentId, stringify, wrapPrivateKey } from '@/id'
import { mutations } from '@/store/mutations'
import { CommonStore } from '@/store'
import { SessionStorageKeys } from '@/constants'
import { createUser, User, UserModel } from '@/db/user'
import { notice } from '@/utils/notification'
import { download } from '@/utils/file'
import { Actions } from '@/store/actions'
import { verifyPassword } from '@/db/user/crypto'

const usernameCache =
    window.sessionStorage.getItem(SessionStorageKeys.Username) || ''
const store = useStore<CommonStore>()
const router = useRouter()
const username = ref(usernameCache)
const password = ref('')
const localUsers = ref<User[]>([])

UserModel.findAll().then((users) => {
    localUsers.value = users
})

function goToComoc() {
    window.sessionStorage.removeItem(SessionStorageKeys.Username)
    router.replace({ name: 'comoc' })
}

async function signInWithPreviousId(user: User) {
    debug('sign in with previous id', user)
    const passwordInput = window.prompt(`Enter user's local password`)
    const password = passwordInput?.trim()
    if (!password) {
        notice('warn', 'password necessary')
        return
    }
    const passwordCorrect = await verifyPassword(password, user.passwordHash)
    if (!passwordCorrect) {
        notice('error', 'password wrong')
        return
    }

    store.dispatch(Actions.SIGN_IN, user)
    goToComoc()
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

        todo('sign in to Beacon server')

        const user = await createUser(
            username.value,
            password.value,
            store.state.currentId.publicKey,
            wrappedPrivateKey
        )
        store.dispatch(Actions.SIGN_IN, user)
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

    .local-user {
        display: inline-block;
        padding: 0.5em 1em;
        border: 1px solid lightgrey;
        box-shadow: 0 0 5px lightgrey;
        cursor: pointer;

        &:hover {
            border: 1px solid grey;
            box-shadow: 0 0 5px 1px lightgrey;
        }
    }
}
</style>
