export function download(content: string, name: string): void {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const $a = document.createElement('a')
    $a.href = url
    $a.download = name
    $a.click()
    URL.revokeObjectURL(url)
}
