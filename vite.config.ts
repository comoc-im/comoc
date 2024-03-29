import { defineConfig } from 'vite'
import { join } from 'path'
import vuePlugin from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
    base: './',
    build: {
        target: 'chrome100',
        sourcemap: true,
    },
    resolve: {
        alias: [
            {
                find: /^@\//,
                replacement: join(__dirname, 'src/'),
            },
        ],
    },
    plugins: [
        vuePlugin(),
        Components({
            resolvers: [VantResolver()],
        }),

        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
                'favicon.png',
                'favicon.ico',
                'robots.txt',
                'apple-touch-icon.png',
            ],
            manifest: {
                name: 'Comoc',
                short_name: 'Comoc',
                description: 'Comoc IM client',
                theme_color: '#000000',
                orientation: 'landscape-primary',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                ],
            },
        }),
    ],
})
