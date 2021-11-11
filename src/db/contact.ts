import Model from '@/db/base'
import { CONTACT_STORE_NAME } from '@/db/store-names'

export default class Contact extends Model {
    username = ''
    publicKey: CryptoKey

    static init(db: IDBDatabase): void {
        try {
            db.deleteObjectStore(CONTACT_STORE_NAME)
        } catch (err) {
            //
        }
        const contactStore = db.createObjectStore(CONTACT_STORE_NAME, {
            autoIncrement: true,
        })
        contactStore.createIndex('publicKey', 'publicKey', { unique: true })
    }

    async save(): Promise<void> {
        await this.put()
    }

    static async findAll(): Promise<Contact[]> {
        return super.getAll<Contact>(CONTACT_STORE_NAME)
    }

    constructor(publicKey: CryptoKey) {
        super(CONTACT_STORE_NAME)

        this.publicKey = publicKey

        // TODO try connect the user, then fetch hers info
        this.username = ''
    }
}
