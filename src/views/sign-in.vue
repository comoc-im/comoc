<template>
    <div class="login">
        <div class="auth-lock">
            <p v-if="isSignedIn">already signed in, jumping now...</p>
            <form v-else @submit.prevent="submit">
                <label>
                    Username
                    <br>
                    <input v-model.trim="username" autocomplete="username" name="username" type="text">
                </label>
                <br>
                <br>
                <label>
                    Password
                    <br>
                    <input v-model.trim="password" autocomplete="current-password" name="password" type="text"
                           @keyup.enter="submit">
                </label>
                <br>
                <br>
                <input type="button" value="Sign Up" @click="create">
                &nbsp;
                <input type="button" value="Sign In" @click="submit">
            </form>
        </div>
    </div>
</template>
<script lang="ts">
    import {defineComponent, ref} from 'vue'
    import {useStore} from "vuex";
    import User from "@/db/user";

    export default defineComponent({
        name: 'login',
        setup () {
            console.log('setup')
            const store = useStore()
            const username = ref('')
            const password = ref('')

            const isSignedIn = ref(!!store.state.user.id)
            return {
                username,
                password,
                isSignedIn
            }
        },
        methods: {
            async create () {
                if (this.username === '' || this.password === '') {
                    return 'username and password necessary'
                }

                const newUser = new User(this.username, this.password)
                await newUser.save()
                console.log(newUser)
            },
            async submit () {
                if (this.username === '' || this.password === '') {
                    return console.log('username and password necessary')
                }

                const user = await User.find(this.username, this.password)
                if (!user) {
                    return console.log('user not found')
                }

                console.log('user found', user)
            }
        }
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
