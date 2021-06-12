import { MESSAGE_STORE_NAME } from '@/db/store-names'
import Model from '@/db/base'

export enum MessageType {
    Text,
}

export default class Message extends Model<Message> {
    id: string
    from: string
    to: string
    type: MessageType
    payload: string

    static init(db: IDBDatabase): void {
        const store = db.createObjectStore(MESSAGE_STORE_NAME, {
            autoIncrement: true,
        })
        store.createIndex('id', 'id', { unique: true })
        store.createIndex('from', 'from', { unique: false })
        store.createIndex('to', 'to', { unique: false })
        store.createIndex('type', 'type', { unique: false })
    }

    constructor(type: MessageType, payload: string, from: string, to: string) {
        super(MESSAGE_STORE_NAME)

        this.id = Date.now().toString() // todo
        this.type = type
        this.payload = payload
        this.from = from
        this.to = to
    }

    async save(): Promise<void> {
        await this.put()
    }
}
