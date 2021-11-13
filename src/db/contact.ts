import Model from '@/db/base'
import { CONTACT_STORE_NAME } from '@/db/store-names'

export interface Contact {
    username: string
    address: string
}

export class ContactModel extends Model implements Contact {
    username: string
    address: string

    static init(db: IDBDatabase): void {
        try {
            db.deleteObjectStore(CONTACT_STORE_NAME)
        } catch (err) {
            //
        }
        const contactStore = db.createObjectStore(CONTACT_STORE_NAME, {
            autoIncrement: true,
        })
        contactStore.createIndex('address', 'address', { unique: true })
    }

    async save(): Promise<void> {
        await this.put()
    }

    static async findAll(): Promise<Contact[]> {
        return super.getAll<Contact>(CONTACT_STORE_NAME)
    }

    constructor(address: string, username = address) {
        super(CONTACT_STORE_NAME)

        this.address = address
        this.username = username
    }
}
