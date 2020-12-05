import Model from "@/db/base";
import {CONTACT_STORE_NAME} from "@/db/store-names";

export default class Contact extends Model<Contact> {

    username: string = '';
    publicKey: CryptoKey;

    static init (db: IDBDatabase): void {
        const contactStore = db.createObjectStore(CONTACT_STORE_NAME, {autoIncrement: true})
        contactStore.createIndex('publicKey', 'publicKey', {unique: true})
    }

    constructor (publicKey: CryptoKey) {
        super(CONTACT_STORE_NAME);

        this.publicKey = publicKey

        // TODO try connect the user, then fetch hers info
        this.username = ''
    }


}
