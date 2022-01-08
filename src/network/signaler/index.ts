import { Signal } from '@comoc-im/message'

export interface Signaler {
    send(data: Signal): void
}
