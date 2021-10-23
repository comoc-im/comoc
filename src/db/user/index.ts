import { USER_STORE_NAME } from '@/db/store-names'
import { verifyPassword } from '@/db/user/crypto'
import Model from '@/db/base'

export default class User extends Model {
    username = ''
    publicKey: CryptoKey
    protected passwordHash = ''

    /**
     * Init User object store
     * @param db
     */
    static init(db: IDBDatabase): void {
        const userStore = db.createObjectStore(USER_STORE_NAME, {
            autoIncrement: true,
        })
        userStore.createIndex('username', 'username', { unique: false })
        userStore.createIndex('publicKey', 'publicKey', { unique: true })
    }

    static async find(
        username: string,
        password: string
    ): Promise<User | null> {
        const users = await super.getAllByIndex<User>(
            USER_STORE_NAME,
            'username',
            username
        )
        if (users.length === 0) {
            return null
        }

        for (const userInDB of users) {
            const isMatch = await verifyPassword(
                password,
                userInDB.passwordHash
            )
            console.log(isMatch, password, userInDB.passwordHash)
            if (isMatch) {
                return userInDB
            }
        }

        return null
    }

    static async findAll(): Promise<User[]> {
        return super.getAll<User>(USER_STORE_NAME)
    }

    constructor(
        username: string,
        passwordHash: string,
        keyPair: CryptoKeyPair
    ) {
        super(USER_STORE_NAME)

        this.username = username
        this.passwordHash = passwordHash
        this.publicKey = keyPair.publicKey
    }

    async save(): Promise<void> {
        await this.put()
    }
}
