import {argon2id} from "hash-wasm";


export async function generateKeyPair (): Promise<CryptoKeyPair> {
    return crypto.subtle
        .generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-521"
            },
            true,
            ["encrypt", "decrypt", "sign", "verify"]
        )
        .then((keypair) => keypair as CryptoKeyPair)
}


/**
 * Derive a hash key from password string
 * use argon2id for now, todo consider passphrases later
 * https://github.com/Daninet/hash-wasm#hashing-passwords-with-argon2
 * @param {string} password
 * @return Promise<string>
 */
export async function derivePasswordKey (password: string): Promise<string> {
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
