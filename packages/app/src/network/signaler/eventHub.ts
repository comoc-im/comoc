type handler<T, K extends keyof T> = (evt: T[K]) => void

export class EventHub<T extends Record<string, unknown>> {
    private eventMap = new Map<keyof T, Set<unknown>>()

    public addEventListener<K extends keyof T>(
        type: K,
        callback: handler<T, K>
    ): void {
        const map = this.eventMap.get(type)
        if (map) {
            map.add(callback)
        } else {
            this.eventMap.set(type, new Set([callback]))
        }
    }

    public dispatchEvent<K extends keyof T>(type: K, payload: T[K]): void {
        const map = this.eventMap.get(type)
        if (!map) {
            return
        }
        for (const listener of map as Set<handler<T, K>>) {
            listener(payload)
        }
    }

    public removeEventListener<K extends keyof T>(
        type: K,
        callback?: handler<T, K>
    ): void {
        if (callback) {
            const map = this.eventMap.get(type)
            map?.delete(callback)
            return
        } else {
            this.eventMap.delete(type)
        }
    }

    public clearEventListeners(): void {
        this.eventMap.clear()
    }
}
