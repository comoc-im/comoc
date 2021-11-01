import { argon2Verify } from 'hash-wasm'

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return argon2Verify({
        password,
        hash,
    })
}
