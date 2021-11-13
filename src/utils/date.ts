export function toDateTimeStr(timestamp: number): string {
    return new Date(timestamp).toLocaleString()
}
