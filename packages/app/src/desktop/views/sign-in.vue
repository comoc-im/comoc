<template>
    <div class="login">
        <a
            class="github-btn"
            target="_blank"
            href="https://github.com/comoc-im/comoc?from=comoc"
            >View on <strong>GitHub</strong>
        </a>
        <div class="auth-lock">
            <template v-if="!currentId">
                <button type="button" @click="importIdFile">
                    Import ComoC-ID
                </button>
                <hr />
            </template>
            <p v-if="store.isSignedIn">already signed in, jumping now...</p>
            <div v-else-if="localUsers.length !== 0">
                <p>Sign in with previous ID</p>
                <button
                    v-for="user in localUsers"
                    :key="user.address"
                    :class="{ selected: selectedUser === user }"
                    :title="'Sign in with ' + (user.username || user.address)"
                    class="local-user"
                    type="button"
                    @click="selectedUser = user"
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
                <template v-if="!currentId">
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
        <p class="usage-notice">
            Comoc IM and related services, software are still in early
            development. Use at your own risk.
            <br />
            Copyright © 2021-{{ new Date().getFullYear() }} Naeemo
        </p>
    </div>
</template>
<script lang="ts" setup>
import { ref, watch } from 'vue'
import { debug, error, todo, warn } from '@/utils/logger'
import { createId, CryptoID, importId } from '@comoc-im/id'
import { importByFile, unwrapPrivateKey, wrapPrivateKey } from '@/utils/id'
import { useSessionStore } from '@/store'
import { SessionStorageKeys } from '@/constants'
import { createUser, User, UserModel } from '@/db/user'
import { notice } from '@/utils/notification'
import { download } from '@/utils/file'
import { verifyPassword } from '@/db/user/crypto'
import { ContactModel } from '@/db/contact'
import { MessageModel } from '@/db/message'
import { ElMessageBox } from 'element-plus'

const usernameCache =
    window.sessionStorage.getItem(SessionStorageKeys.Username) || ''
const store = useSessionStore()
const username = ref(usernameCache)
const password = ref('')
const localUsers = ref<User[]>([])
const selectedUser = ref<User | null>(null)
const currentId = ref<CryptoID | null>(null)

const cacheStr = window.sessionStorage.getItem(SessionStorageKeys.CurrentId)
if (cacheStr) {
    importId(cacheStr.trim()).then((id) => {
        currentId.value = id
    })
}

UserModel.findAll().then((users) => {
    localUsers.value = users
})

async function signInWithPreviousId() {
    if (!selectedUser.value) {
        return
    }
    const user = selectedUser.value
    debug('sign in with previous id', user)
    const { value: passwordInput } = await ElMessageBox.prompt(`Password`, '', {
        inputType: 'password',
    })
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

    window.sessionStorage.removeItem(SessionStorageKeys.Username)
    window.sessionStorage.removeItem(SessionStorageKeys.CurrentId)
    store.signIn({
        username: user.username,
        address: user.address,
        passwordHash: user.passwordHash,
        publicKey: user.publicKey,
        privateKey: await unwrapPrivateKey(password, user.privateKey),
    })
}

async function deleteLocalUser() {
    if (!selectedUser.value) {
        return
    }
    const user = selectedUser.value
    const sure = await ElMessageBox.confirm(
        'Delete local user will remove all local data, you sure?'
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
    await MessageModel.deleteMany(user.address)
}

async function importIdFile(): Promise<void> {
    const id = await importByFile()
    if (!id) {
        notice('warn', 'not valid ID')
        return
    }
    currentId.value = id
    window.sessionStorage.setItem(SessionStorageKeys.CurrentId, id.toString())
}

async function create() {
    if (username.value === '') {
        warn('username necessary')
        notice('warn', 'username necessary')
        return
    }

    try {
        const id = await createId()
        download(id.toString(), `${username.value}.id`)
        currentId.value = id
        window.sessionStorage.setItem(
            SessionStorageKeys.CurrentId,
            id.toString()
        )
    } catch (err) {
        error(`create fail, ${err}`)
        notice('error', `create fail, ${err}`)
    }
}

async function signIn() {
    if (!currentId.value) {
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
            currentId.value.privateKey
        )

        todo('sign in to Beacon server')

        const user = await createUser(
            username.value,
            password.value,
            currentId.value.publicKey,
            wrappedPrivateKey
        )
        window.sessionStorage.removeItem(SessionStorageKeys.Username)
        window.sessionStorage.removeItem(SessionStorageKeys.CurrentId)
        store.signIn({
            username: user.username,
            address: user.address,
            passwordHash: user.passwordHash,
            publicKey: user.publicKey,
            privateKey: currentId.value.privateKey,
        })
    } catch (err) {
        error(`sign in fail, ${err}`)
        notice('error', `sign in fail, ${err}`)
    }
}

watch(username, (newName, oldName) => {
    if (newName !== oldName) {
        window.sessionStorage.setItem(SessionStorageKeys.Username, newName)
    }
})
</script>
<style lang="scss">
.login {
    .github-btn {
        position: absolute;
        top: 0;
        right: 0;
        margin: 1em;
        padding: 0.5em;
        border: 4px solid lightblue;
        border-radius: 4px;
        text-decoration: none;
        background-color: dodgerblue;
        color: white;
        transition: background-color 100ms linear;

        &:hover {
            text-decoration: underline;
            background-color: #1a79d9;
        }
    }

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

    .usage-notice {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        text-align: center;
        color: #666;
    }
}
</style>
