import { Address } from '@comoc-im/message'
import { v4 } from 'uuid'
import { StoreNames } from '@/db/store-names'
import { collectByIndex, deleteMany, put } from '@/db/base'

export enum MessageType {
    Text,
}

export interface Message {
    id: string
    type: MessageType
    payload: string
    timestamp: number
    author: Address // Who creates the message
    from: Address
    to: Address
}

export function newMessageId(): string {
    return v4()
}

export class MessageModel implements Message {
    id: string
    owner: Address // who owns the message in db
    author: Address
    from: Address
    to: Address
    type: MessageType
    payload: string
    timestamp: number

    constructor(
        owner: Address,
        { from, to, id, type, payload, timestamp, author }: Message
    ) {
        this.owner = owner
        this.type = type
        this.payload = payload
        this.from = from
        this.author = author
        this.to = to
        this.id = id
        this.timestamp = timestamp
    }

    static init(db: IDBDatabase): void {
        try {
            db.deleteObjectStore(StoreNames.MESSAGE)
        } catch (err) {
            //
        }
        const store = db.createObjectStore(StoreNames.MESSAGE, {
            autoIncrement: true,
        })
        store.createIndex('id', 'id', { unique: true })
        store.createIndex('from', 'from', { unique: false })
        store.createIndex('to', 'to', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('owner', 'owner', { unique: false })
        store.createIndex('author', 'author', { unique: false })
    }

    public static async getHistoryWith(
        userId: string,
        targetUserId: string
    ): Promise<Message[]> {
        const result: Message[] = []
        const messages = await collectByIndex<MessageModel>(
            StoreNames.MESSAGE,
            'timestamp'
        )
        for await (const msg of messages) {
            if (
                (msg.from === userId && msg.to === targetUserId) ||
                (msg.from === targetUserId && msg.to === userId)
            ) {
                result.push(msg)
            }
        }
        return result
    }

    public static async getRecentChats(userId: string): Promise<Message[]> {
        const result: Message[] = []
        const addresses = new Set<Address>()
        const messages = await collectByIndex<MessageModel>(
            StoreNames.MESSAGE,
            'timestamp',
            'prev'
        )
        for await (const msg of messages) {
            if (msg.from !== userId && msg.to !== userId) {
                continue
            }

            const targetAddress = msg.from === userId ? msg.to : msg.from
            if (addresses.has(targetAddress)) {
                continue
            }

            addresses.add(targetAddress)
            result.push(msg)
        }

        return result
    }

    public static async deleteMany(owner: Address): Promise<number> {
        return deleteMany<MessageModel>(
            StoreNames.MESSAGE,
            (m) => m.owner == owner
        )
    }

    async save(): Promise<void> {
        await put(StoreNames.MESSAGE, this)
    }
}
