import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'id',
        },
    },
    resolve: {
        alias: [
            {
                find: 'src',
                replacement: resolve(__dirname, 'src'),
            },
            {
                find: 'test',
                replacement: resolve(__dirname, 'test'),
            },
        ],
    },
})
