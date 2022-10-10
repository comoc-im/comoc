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

export function concatArrayBuffers(...bufs: ArrayBuffer[]): ArrayBuffer {
    const result = new Uint8Array(
        bufs.reduce((totalSize, buf) => totalSize + buf.byteLength, 0)
    )
    bufs.reduce((offset, buf) => {
        result.set(new Uint8Array(buf), offset)
        return offset + buf.byteLength
    }, 0)
    return result.buffer
}
