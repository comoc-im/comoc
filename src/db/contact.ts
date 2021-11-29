import Model from '@/db/base'
import { CONTACT_STORE_NAME } from '@/db/store-names'
import { Address } from '@comoc-im/message'

export interface Contact {
    username: string
    address: string
    owner: Address
}

export class ContactModel extends Model implements Contact {
    username: string
    address: Address
    owner: Address

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

    static async findAll(owner: Address): Promise<Contact[]> {
        return super.getAllBy<Contact>(
            CONTACT_STORE_NAME,
            (c) => c.owner === owner
        )
    }

    public static async deleteMany(owner: Address): Promise<number> {
        return super.deleteMany<ContactModel>(
            CONTACT_STORE_NAME,
            (c) => c.owner == owner
        )
    }

    constructor(address: Address, owner: Address, username = address) {
        super(CONTACT_STORE_NAME)

        this.address = address
        this.username = username
        this.owner = owner
    }
}
