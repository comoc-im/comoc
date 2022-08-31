import { bytesToHex, hexToBytes } from './address'

export async function sign(
    privateKey: CryptoKey,
    data: BufferSource
): Promise<string> {
    const buffer = await window.crypto.subtle.sign(
        {
            name: 'ECDSA',
            hash: { name: 'SHA-384' },
        },
        privateKey,
        data
    )
    return bytesToHex(buffer)
}

export async function verify(
    publicKey: CryptoKey,
    data: BufferSource,
    signature: string
): Promise<boolean> {
    const signatureBuf = await hexToBytes(signature)
    return window.crypto.subtle.verify(
        {
            name: 'ECDSA',
            hash: { name: 'SHA-384' },
        },
        publicKey,
        signatureBuf,
        data
    )
}
