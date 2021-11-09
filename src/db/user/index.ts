import { USER_STORE_NAME } from '@/db/store-names'
import { derivePassword, verifyPassword } from '@/db/user/crypto'
import Model from '@/db/base'

export class User extends Model {
    public username: string
    public publicKey: CryptoKey
    private privateKey: unknown
    private passwordHash: string

    constructor({
        username,
        passwordHash,
        publicKey,
        privateKey,
    }: {
        username: string
        publicKey: CryptoKey
        passwordHash: string
        privateKey: unknown
    }) {
        super(USER_STORE_NAME)

        this.username = username
        this.passwordHash = passwordHash
        this.publicKey = publicKey
        this.privateKey = privateKey
    }

    /**
     * Init User object store
     * @param db
     */
    static init(db: IDBDatabase): void {
        try {
            db.deleteObjectStore(USER_STORE_NAME)
        } catch (err) {
            //
        }
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

    async save(): Promise<void> {
        await this.put()
    }
}

export async function createUser(
    username: string,
    password: string,
    publicKey: CryptoKey,
    privateKey: unknown
): Promise<User> {
    const user = new User({
        username,
        passwordHash: await derivePassword(password),
        publicKey,
        privateKey,
    })
    await user.save()
    return user
}
