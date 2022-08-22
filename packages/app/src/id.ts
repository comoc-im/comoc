import { CryptoID, importId } from '@comoc-im/id'

export interface ComocID {
    publicKey: CryptoKey
    privateKey: CryptoKey
}

export async function stringify(id: ComocID): Promise<string> {
    return JSON.stringify({
        privateKey: await window.crypto.subtle.exportKey('jwk', id.privateKey),
        publicKey: await window.crypto.subtle.exportKey('jwk', id.publicKey),
    })
}

export function importByFile(): Promise<CryptoID | null> {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.id'
    const result = new Promise<CryptoID | null>((resolve) => {
        input.onchange = async () => {
            const file = input.files?.[0]
            if (!file) {
                return
            }

            const fr = new FileReader()
            fr.onload = async () => {
                resolve(importId(fr.result as string))
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
