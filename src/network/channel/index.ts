import Message from '@/db/message'

export interface Channel {
    send(msg: Message): void

    onMessage(func: (msg: Message) => unknown): void
}
