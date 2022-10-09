import { Address } from '@comoc-im/id'
import { StoreNames } from '@/db/store-names'
import { deleteMany, getAllBy, put } from '@/db/base'

export interface Contact {
    username: string
    address: string
}

export class ContactModel implements Contact {
    username: string
    address: Address
    owner: Address

    static init(db: IDBDatabase): void {
        try {
            db.deleteObjectStore(StoreNames.CONTACT)
        } catch (err) {
            //
        }
        const contactStore = db.createObjectStore(StoreNames.CONTACT, {
            autoIncrement: true,
        })
        contactStore.createIndex('address', 'address', { unique: true })
    }

    async save(): Promise<void> {
        await put(StoreNames.CONTACT, this)
    }

    static async findAll(owner: Address): Promise<Contact[]> {
        return getAllBy<ContactModel>(
            StoreNames.CONTACT,
            (c) => c.owner === owner
        )
    }

    public static async deleteMany(owner: Address): Promise<number> {
        return deleteMany<ContactModel>(
            StoreNames.CONTACT,
            (c) => c.owner == owner
        )
    }

    constructor(address: Address, owner: Address, username = address) {
        this.address = address
        this.username = username
        this.owner = owner
    }
}
