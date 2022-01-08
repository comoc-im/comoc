type StringKeyOf<T extends Record<string, unknown>> = Exclude<
    keyof T,
    number | symbol
>

export class EventHub<T extends Record<string, unknown>> {
    private eventMap = new Map<
        StringKeyOf<T>,
        Set<(evt: T[StringKeyOf<T>]) => void>
    >()

    public addEventListener(
        type: StringKeyOf<T>,
        callback: (evt: T[StringKeyOf<T>]) => void
    ): void {
        const map = this.eventMap.get(type)
        if (map) {
            map.add(callback)
        } else {
            this.eventMap.set(
                type,
                new Set<(evt: T[StringKeyOf<T>]) => void>([callback])
            )
        }
    }

    public dispatchEvent(
        type: StringKeyOf<T>,
        payload: T[StringKeyOf<T>]
    ): void {
        const map = this.eventMap.get(type)
        if (!map) {
            return
        }
        for (const listener of map) {
            listener(payload)
        }
    }

    public removeEventListener(
        type: StringKeyOf<T>,
        callback?: (evt: T[StringKeyOf<T>]) => void
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
