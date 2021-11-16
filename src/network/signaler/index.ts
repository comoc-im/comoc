import { Signal } from '@comoc-im/message'

export enum SignalingMessageType {
    Description = 'description',
    Candidate = 'candidate',
    Heartbeat = 'heartbeat',
}

export type SignalingMessage = {
    from: string
    to: string
    type: SignalingMessageType
    payload: string
}

export interface Signaler {
    send(data: Signal): void

    onMessage(func: (msg: Signal) => unknown): Promise<() => void>
}
