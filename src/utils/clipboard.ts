export async function copy(source: string): Promise<void> {
    return navigator.clipboard.writeText(source)
}
