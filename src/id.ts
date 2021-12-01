import { SessionStorageKeys } from '@/constants'
import { debug, error } from '@/utils/logger'
import { Address, addressToBytes, bytesToAddress } from '@comoc-im/message'

export interface ComocID {
    publicKey: CryptoKey
    privateKey: CryptoKey
}

interface ComocIdCache {
    publicKey: JsonWebKey
    privateKey: JsonWebKey
}

export async function createId(): Promise<ComocID> {
    try {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: 'ECDSA',
                namedCurve: 'P-384',
            },
            true,
            ['sign', 'verify']
        )
        debug(`generating keypair success,`, keyPair)
        return keyPair as Required<CryptoKeyPair>
    } catch (err) {
        error(`generating keypair fail`, err)
        throw err
    }
}

export async function stringify(id: ComocID): Promise<string> {
    return JSON.stringify({
        privateKey: await window.crypto.subtle.exportKey('jwk', id.privateKey),
        publicKey: await window.crypto.subtle.exportKey('jwk', id.publicKey),
    })
}

export function importByFile(file: File): Promise<ComocID> {
    return new Promise((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = async () => {
            try {
                console.warn(fr.result)
                const { privateKey, publicKey } = JSON.parse(
                    fr.result as string
                ) as ComocIdCache
                resolve({
                    privateKey: await window.crypto.subtle.importKey(
                        'jwk',
                        privateKey,
                        {
                            name: 'ECDSA',
                            namedCurve: 'P-384',
                        },
                        true,
                        ['sign']
                    ),
                    publicKey: await window.crypto.subtle.importKey(
                        'jwk',
                        publicKey,
                        {
                            name: 'ECDSA',
                            namedCurve: 'P-384',
                        },
                        true,
                        ['verify']
                    ),
                })
            } catch (err) {
                reject(err)
            }
        }
        fr.readAsText(file)
    })
}

export async function setCurrentId(id: ComocID): Promise<void> {
    const idCache: ComocIdCache = {
        privateKey: await window.crypto.subtle.exportKey('jwk', id.privateKey),
        publicKey: await window.crypto.subtle.exportKey('jwk', id.publicKey),
    }
    window.sessionStorage.setItem(
        SessionStorageKeys.CurrentId,
        JSON.stringify(idCache)
    )
}

export async function getCurrentId(): Promise<ComocID | null> {
    const cacheStr = window.sessionStorage.getItem(SessionStorageKeys.CurrentId)
    if (!cacheStr) {
        return null
    }

    try {
        const idCache: ComocIdCache = JSON.parse(cacheStr.trim())
        return {
            privateKey: await window.crypto.subtle.importKey(
                'jwk',
                idCache.privateKey,
                {
                    name: 'ECDSA',
                    namedCurve: 'P-384',
                },
                true,
                ['sign']
            ),
            publicKey: await window.crypto.subtle.importKey(
                'jwk',
                idCache.publicKey,
                {
                    name: 'ECDSA',
                    namedCurve: 'P-384',
                },
                true,
                ['verify']
            ),
        }
    } catch (err) {
        error(`read current id from session storage fail`, err)
        return null
    }
}

/**
 * Get some key material to use as input to the deriveKey method.
 * The key material is a password supplied by the user.
 */
function getKeyMaterial(password: string): Promise<CryptoKey> {
    const enc = new TextEncoder()
    return window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    )
}

/**
 * Given some key material and some random salt
 * derive an AES-GCM key using PBKDF2.
 */
function getKey(keyMaterial: CryptoKey, salt: Uint8Array) {
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['wrapKey', 'unwrapKey']
    )
}

interface WrappedPrivateKey {
    salt: Uint8Array
    iv: Uint8Array
    wrapped: ArrayBuffer
}

export async function wrapPrivateKey(
    password: string,
    privateKey: CryptoKey
): Promise<WrappedPrivateKey> {
    // get the key encryption key
    const keyMaterial = await getKeyMaterial(password)
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const wrappingKey = await getKey(keyMaterial, salt)
    const wrapped = await window.crypto.subtle.wrapKey(
        'jwk',
        privateKey,
        wrappingKey,
        {
            name: 'AES-GCM',
            iv,
        }
    )

    return {
        salt,
        iv,
        wrapped,
    }
}

export async function unwrapPrivateKey(
    password: string,
    salt: Uint8Array,
    iv: Uint8Array,
    wrappedKey: ArrayBuffer
): Promise<CryptoKey> {
    const keyMaterial = await getKeyMaterial(password)
    const unwrappingKey = await getKey(keyMaterial, salt)
    // 3. unwrap the key
    return window.crypto.subtle.unwrapKey(
        'jwk', // import format
        wrappedKey, // ArrayBuffer representing key to unwrap
        unwrappingKey, // CryptoKey representing key encryption key
        { name: 'AES-GCM', iv }, // algorithm identifier for key encryption key
        { name: 'ECDSA', namedCurve: 'P-384' }, // algorithm identifier for key to unwrap
        true, // extractability of key to unwrap
        ['sign'] // key usages for key to unwrap
    )
}

export async function toAddress(publicKey: CryptoKey): Promise<Address> {
    const raw = await window.crypto.subtle.exportKey('raw', publicKey)
    const bytes = new Uint8Array(raw)
    const address = bytesToAddress(bytes)
    debug(address)
    return address
}

export async function fromAddress(address: string): Promise<CryptoKey | null> {
    try {
        const buffer = addressToBytes(address)
        return await window.crypto.subtle.importKey(
            'raw',
            buffer,
            {
                name: 'ECDSA',
                namedCurve: 'P-384',
            },
            true,
            ['verify']
        )
    } catch (err) {
        error(`import from hex string fail`, err, address)
        return null
    }
}
