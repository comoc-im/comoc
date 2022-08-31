interface ExportIdObject {
    p: JsonWebKey // public key
    s: JsonWebKey // private key
}

export async function exportKeyPair(
    keyPair: CryptoKeyPair
): Promise<{ exportPrivateKey: JsonWebKey; exportPublicKey: JsonWebKey }> {
    const exportPrivateKey = await window.crypto.subtle.exportKey(
        'jwk',
        keyPair.privateKey
    )
    const exportPublicKey = await window.crypto.subtle.exportKey(
        'jwk',
        keyPair.publicKey
    )
    return { exportPrivateKey, exportPublicKey }
}

export function stringify(
    exportPrivateKey: JsonWebKey,
    exportPublicKey: JsonWebKey
): string {
    const obj: ExportIdObject = {
        s: exportPrivateKey,
        p: exportPublicKey,
    }
    return JSON.stringify(obj)
}

export async function parse(source: string): Promise<{
    exportPrivateKey: JsonWebKey
    exportPublicKey: JsonWebKey
} | null> {
    const { s, p } = JSON.parse(source) as ExportIdObject
    return { exportPrivateKey: s, exportPublicKey: p }
}
