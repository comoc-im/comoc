const byteToHex: string[] = []

for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, '0')
    byteToHex.push(hexOctet)
}

export function buf2hex(buffer: ArrayBufferLike): string {
    return Array.prototype.map
        .call(new Uint8Array(buffer), (n) => byteToHex[n])
        .join('')
}

export function hex2buf(hex: string): ArrayBufferLike {
    const result: string[] = hex.match(/[\da-f]{2}/gi) || []
    const typedArr = new Uint8Array(result.map((h) => parseInt(h, 16)))
    return typedArr.buffer
}
