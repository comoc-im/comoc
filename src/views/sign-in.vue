<template>
    <div class="login">
        <div class="auth-lock">
            <template v-if="!store.currentId">
                <button type="button" @click="importIdFile">
                    Import ComoC-ID
                </button>
                <hr />
            </template>
            <p v-if="store.isSignedIn">already signed in, jumping now...</p>
            <div v-else-if="localUsers.length !== 0">
                <p>Sign in with previous ID</p>
                <button
                    class="local-user"
                    type="button"
                    :class="{ selected: selectedUser === user }"
                    v-for="user in localUsers"
                    :key="user.address"
                    @click="selectedUser = user"
                    :title="'Sign in with ' + (user.username || user.address)"
                >
                    {{ user.username || user.address }}
                </button>
                <br />
                <br />
                <template v-if="selectedUser">
                    <button
                        class="btn"
                        type="button"
                        @click="signInWithPreviousId"
                    >
                        Sign In
                    </button>
                    &nbsp;
                    <button
                        class="btn red"
                        type="button"
                        @click="deleteLocalUser"
                    >
                        Delete
                    </button>
                </template>
                <hr />
                or
                <button type="button" @click="localUsers = []">Create</button>
                new Comoc ID
            </div>
            <form v-else>
                <template v-if="!store.currentId">
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
import { useRouter } from 'vue-router'
import { debug, error, todo, warn } from '@/utils/logger'
import {
    createId,
    importByFile,
    setCurrentId,
    stringify,
    wrapPrivateKey,
} from '@/id'
import { useSessionStore } from '@/store'
import { SessionStorageKeys } from '@/constants'
import { createUser, User, UserModel } from '@/db/user'
import { notice } from '@/utils/notification'
import { download } from '@/utils/file'
import { verifyPassword } from '@/db/user/crypto'
import { ContactModel } from '@/db/contact'
import Message from '@/db/message'
import { RouteName } from '@/router/routes'

const usernameCache =
    window.sessionStorage.getItem(SessionStorageKeys.Username) || ''
const store = useSessionStore()
const router = useRouter()
const username = ref(usernameCache)
const password = ref('')
const localUsers = ref<User[]>([])
const selectedUser = ref<User | null>(null)

UserModel.findAll().then((users) => {
    localUsers.value = users
})

function goToComoc() {
    window.sessionStorage.removeItem(SessionStorageKeys.Username)
    router.replace({ name: RouteName.Comoc })
}

async function signInWithPreviousId() {
    if (!selectedUser.value) {
        return
    }
    const user = selectedUser.value
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

    store.signIn(user)
    goToComoc()
}

async function deleteLocalUser() {
    if (!selectedUser.value) {
        return
    }
    const user = selectedUser.value
    const sure = window.confirm(
        'Delete local user will remove all her local data, you sure?'
    )
    if (!sure) {
        return
    }
    const index = localUsers.value.findIndex(
        ({ address }) => user.address === address
    )
    localUsers.value.splice(index, 1)
    await UserModel.delete(user)
    await ContactModel.deleteMany(user.address)
    await Message.deleteMany(user.address)
}

async function importIdFile(): Promise<void> {
    const id = await importByFile()
    store.currentId = id
    setCurrentId(id)
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
        store.currentId = id
        setCurrentId(id)
    } catch (err) {
        error(`create fail, ${err}`)
        notice('error', `create fail, ${err}`)
    }
}

async function signIn() {
    if (!store.currentId) {
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
            store.currentId.privateKey
        )

        todo('sign in to Beacon server')

        const user = await createUser(
            username.value,
            password.value,
            store.currentId.publicKey,
            wrappedPrivateKey
        )
        store.signIn(user)
        goToComoc()
    } catch (err) {
        error(`sign in fail, ${err}`)
        notice('error', `sign in fail, ${err}`)
    }
}

if (store.isSignedIn) {
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
        max-width: 10em;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;

        &:hover,
        &:focus-visible,
        &:focus {
            border: 1px solid grey;
            box-shadow: 0 0 5px 1px lightgrey;
        }

        &.selected {
            color: royalblue;
            font-weight: bold;
            background-color: white;
            border: 1px solid royalblue;
            //box-shadow: 0 0 5px 1px limegreen;
        }
    }
}
</style>
