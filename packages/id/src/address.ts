export type Address = string

const byteToHex: string[] = []

for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, '0')
    byteToHex.push(hexOctet)
}

export function bytesToHex(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer)
    const raw = Array.prototype.map.call(bytes, (n) => byteToHex[n]).join('')
    return raw.replace(/0*$/gi, '')
}

export function hexToBytes(address: Address): Uint8Array {
    const result: string[] = address.match(/[\da-f]{2}/gi) || []
    return new Uint8Array(result.map((h) => parseInt(h, 16)))
}

export const bytesToAddress = bytesToHex
export const addressToBytes = hexToBytes

export async function toAddress(publicKey: CryptoKey): Promise<Address> {
    const raw = await window.crypto.subtle.exportKey('raw', publicKey)
    const bytes = new Uint8Array(raw)
    const address = bytesToHex(bytes)
    return address
}

export async function fromAddress(address: string): Promise<CryptoKey | null> {
    try {
        const buffer = hexToBytes(address)
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
        console.error(`import from hex string fail`, err, address)
        return null
    }
}
