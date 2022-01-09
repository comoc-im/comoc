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
        ],
    },
    plugins: [vuePlugin()],
})
