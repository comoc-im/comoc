import { MESSAGE_STORE_NAME } from '@/db/store-names'
import Model from '@/db/base'
import { Address, Signal } from '@comoc-im/message'
import { v4 } from 'uuid'

export enum MessageType {
    Text,
}

export default class Message extends Model {
    id: string
    owner: Address
    from: string
    to: string
    type: MessageType
    payload: string
    timestamp: number

    constructor(
        type: MessageType,
        payload: string,
        from: string,
        to: string,
        owner: Address,
        id = v4(),
        timestamp = Date.now()
    ) {
        super(MESSAGE_STORE_NAME)

        this.owner = owner
        this.type = type
        this.payload = payload
        this.from = from
        this.to = to
        this.id = id
        this.timestamp = timestamp
    }

    static init(db: IDBDatabase): void {
        try {
            db.deleteObjectStore(MESSAGE_STORE_NAME)
        } catch (err) {
            //
        }
        const store = db.createObjectStore(MESSAGE_STORE_NAME, {
            autoIncrement: true,
        })
        store.createIndex('id', 'id', { unique: true })
        store.createIndex('from', 'from', { unique: false })
        store.createIndex('to', 'to', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('owner', 'owner', { unique: false })
    }

    public static async fromSignal(
        s: Signal,
        owner: Address
    ): Promise<Message> {
        const blob = new Blob([s.payload], {
            type: 'application/json; charset=utf-8',
        })
        const str = await blob.text()
        const msg = JSON.parse(str) as {
            id: string
            type: MessageType
            payload: string
            timestamp: number
        }
        return new Message(
            msg.type,
            msg.payload,
            s.from,
            s.to,
            owner,
            msg.id,
            msg.timestamp
        )
    }

    public static async getHistoryWith(
        userId: string,
        targetUserId: string
    ): Promise<Message[]> {
        const result: Message[] = []
        const messages = Model.collectByIndex<Message>(
            MESSAGE_STORE_NAME,
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

    public static async deleteMany(owner: Address): Promise<number> {
        return super.deleteMany<Message>(
            MESSAGE_STORE_NAME,
            (m) => m.owner == owner
        )
    }

    async save(): Promise<void> {
        await this.put()
    }

    public async toSignal(): Promise<Signal> {
        const str = JSON.stringify({
            id: this.id,
            type: this.type,
            payload: this.payload,
            timestamp: this.timestamp,
        })
        const blob = new Blob([str], {
            type: 'application/json; charset=utf-8',
        })
        const buffer = await blob.arrayBuffer()
        return new Signal(this.from, this.to, new Uint8Array(buffer))
    }
}
