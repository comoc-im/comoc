import { Address } from '@comoc-im/message'

export async function jsonToBuffer(source: string): Promise<ArrayBuffer> {
    const blob = new Blob([source], {
        type: 'application/json; charset=utf-8',
    })
    return await blob.arrayBuffer()
}

export async function bufferToJson(buffer: BufferSource): Promise<string> {
    const blob = new Blob([buffer], {
        type: 'application/json; charset=utf-8',
    })
    return blob.text()
}

const byteToHex: string[] = []

for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, '0')
    byteToHex.push(hexOctet)
}

export function bufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    const raw = Array.prototype.map.call(bytes, (n) => byteToHex[n]).join('')
    return raw.replace(/0*$/gi, '')
}

export function hexToBuffer(address: Address): Uint8Array {
    const result: string[] = address.match(/[\da-f]{2}/gi) || []
    return new Uint8Array(result.map((h) => parseInt(h, 16)))
}
