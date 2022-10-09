import { concatArrayBuffers } from '@/utils/buffer'
import { debug } from '@/utils/logger'
import { bytesToHex, hexToBytes } from '@comoc-im/id'
import { isSameKey } from '@/utils/id'

export class P2pCrypto {
    private static readonly IV_LENGTH = 12
    private readonly ecdhPair: CryptoKeyPair
    private key?: CryptoKey

    public async getEcdhPublicKey(): Promise<string> {
        const raw = await window.crypto.subtle.exportKey(
            'raw',
            this.ecdhPair.publicKey
        )
        const bytes = new Uint8Array(raw)
        const hex = bytesToHex(bytes)
        return hex
    }

    constructor(ecdhPair: CryptoKeyPair) {
        this.ecdhPair = ecdhPair
    }

    public static async create(): Promise<P2pCrypto> {
        const keypair = await window.crypto.subtle.generateKey(
            {
                name: 'ECDH',
                namedCurve: 'P-384',
            },
            true,
            ['deriveKey']
        )
        return new P2pCrypto(keypair)
    }

    public async encrypt(data: string): Promise<ArrayBuffer> {
        if (!this.key) {
            throw new Error('encrypt no key')
        }
        const enc = new TextEncoder()
        const payload = enc.encode(data)
        const iv = window.crypto.getRandomValues(
            new Uint8Array(P2pCrypto.IV_LENGTH)
        )

        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.key,
            payload
        )
        return concatArrayBuffers(iv, encrypted)
    }

    public async decrypt(payload: ArrayBuffer): Promise<string> {
        if (!this.key) {
            throw new Error('decrypt no key')
        }
        const iv = new Uint8Array(payload).slice(0, P2pCrypto.IV_LENGTH)
        const _payload = new Uint8Array(payload).slice(P2pCrypto.IV_LENGTH)
        const ab = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv,
            },
            this.key,
            _payload
        )
        const dec = new TextDecoder()
        const data = dec.decode(ab)
        return data
    }

    public async deriveKey(remoteEcdhPublicKey: string): Promise<boolean> {
        const buffer = hexToBytes(remoteEcdhPublicKey)
        const pk = await window.crypto.subtle.importKey(
            'raw',
            buffer,
            {
                name: 'ECDH',
                namedCurve: 'P-384',
            },
            true,
            []
        )
        if (pk === null) {
            throw new Error()
        }
        const key = await window.crypto.subtle.deriveKey(
            {
                name: 'ECDH',
                public: pk,
            },
            this.ecdhPair.privateKey,
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt', 'decrypt']
        )
        const changed = !this.key || !(await isSameKey(this.key, key))
        debug('p2p crypto derive key', remoteEcdhPublicKey, key, this.key)
        this.key = key
        return changed
    }
}
