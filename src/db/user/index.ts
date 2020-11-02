import {USER_STORE_NAME} from "@/db/store-names";
import {derivePasswordKey, verifyPassword} from "@/db/user/crypto";
import Model from "@/db/base";

/**
 * Init User object store
 * @param db
 */
export function initUser (db: IDBDatabase): void {
    const userStore = db.createObjectStore(USER_STORE_NAME, {autoIncrement: true})
    userStore.createIndex('username', 'username', {unique: false})
    userStore.createIndex('publicKey', 'publicKey', {unique: true})
}

export default class User extends Model<User> {

    username = '';
    publicKey: CryptoKey | null = null;
    protected passwordHash = '';
    #getPasswordHash: Promise<string>

    static async find (username: string, password: string): Promise<User | null> {
        const user = new User(username, password)

        const users = await user.getAllByIndex('username', username)
        if (users.length === 0) {
            return null
        }

        for (const userInDB of users) {
            const isMatch = await verifyPassword(password, userInDB.passwordHash)
            console.log(isMatch, password, userInDB.passwordHash)
            if (isMatch) {
                return userInDB
            }
        }

        return null
    }


    constructor (username: string, password: string) {
        super(USER_STORE_NAME)

        this.username = username
        this.#getPasswordHash = derivePasswordKey(password)
    }

    async save () {
        this.passwordHash = await this.#getPasswordHash
        await this.put()
    }

}
