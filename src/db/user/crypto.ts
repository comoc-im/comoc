import { argon2id, argon2Verify } from 'hash-wasm'

/**
 * Derive a hash key from password string
 * use argon2id for now, todo consider passphrases later
 * https://github.com/Daninet/hash-wasm#hashing-passwords-with-argon2
 * @param {string} password
 * @return Promise<string>
 */
export async function derivePassword(password: string): Promise<string> {
    return argon2id({
        password,
        salt: window.crypto.getRandomValues(new Uint8Array(32)),
        parallelism: 1,
        iterations: 256,
        memorySize: 512, // use 512KB memory
        hashLength: 32, // output size = 32 bytes
        outputType: 'encoded', // return standard encoded string containing parameters needed to verify the key
    })
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return argon2Verify({
        password,
        hash,
    })
}
