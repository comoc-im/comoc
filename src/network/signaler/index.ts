import { Signal } from '@comoc-im/message'

export interface Signaler {
    send(data: Signal): void

    onMessage(func: (msg: Signal) => unknown): Promise<() => void>
}
