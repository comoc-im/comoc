import { defineConfig } from 'vite'
import { join } from 'path'
import vuePlugin from '@vitejs/plugin-vue'

export default defineConfig({
    resolve: {
        alias: [
            {
                find: /^@\//,
                replacement: join(__dirname, 'src/'),
            },
            {
                find: /^web3/,
                replacement: join(
                    __dirname,
                    'node_modules/web3/dist/web3.min.js'
                ),
            },
        ],
    },
    plugins: [vuePlugin()],
})
