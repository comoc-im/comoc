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
