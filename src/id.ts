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

export async function parse(source: string): Promise<ComocID | null> {
    try {
        const { privateKey, publicKey } = JSON.parse(source) as ComocIdCache
        return {
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
        }
    } catch (err) {
        return null
    }
}

export function importByFile(): Promise<ComocID | null> {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.id'
    const result = new Promise<ComocID | null>((resolve) => {
        input.onchange = async () => {
            const file = input.files?.[0]
            if (!file) {
                return
            }

            const fr = new FileReader()
            fr.onload = async () => {
                resolve(parse(fr.result as string))
            }
            fr.readAsText(file)
        }
    })
    input.click()
    return result
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

export interface WrappedPrivateKey {
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
    { salt, iv, wrapped }: WrappedPrivateKey
): Promise<CryptoKey> {
    const keyMaterial = await getKeyMaterial(password)
    const unwrappingKey = await getKey(keyMaterial, salt)
    // 3. unwrap the key
    return window.crypto.subtle.unwrapKey(
        'jwk', // import format
        wrapped, // ArrayBuffer representing key to unwrap
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
