import { Address } from '@comoc-im/message'
import { USER_STORE_NAME } from '@/db/store-names'
import { derivePassword } from '@/db/user/crypto'
import Model from '@/db/base'
import { toAddress, WrappedPrivateKey } from '@/id'

export interface User {
    username: string
    address: Address
    passwordHash: string
    publicKey: CryptoKey
    privateKey: WrappedPrivateKey
}

export class UserModel extends Model implements User {
    public username: string
    public address: Address
    public passwordHash: string
    public publicKey: CryptoKey
    public privateKey: WrappedPrivateKey

    constructor({
        username,
        passwordHash,
        address,
        publicKey,
        privateKey,
    }: {
        username: string
        publicKey: CryptoKey
        address: string
        passwordHash: string
        privateKey: WrappedPrivateKey
    }) {
        super(USER_STORE_NAME)

        this.username = username
        this.passwordHash = passwordHash
        this.publicKey = publicKey
        this.address = address
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
        userStore.createIndex('address', 'address', { unique: true })
    }

    static async findAll(): Promise<User[]> {
        return super.getAll<User>(USER_STORE_NAME)
    }

    public static async delete(user: User): Promise<void> {
        await super.deleteMany<UserModel>(
            USER_STORE_NAME,
            (u) => u.address == user.address
        )
    }

    async save(): Promise<void> {
        await this.put()
    }
}

export async function createUser(
    username: string,
    password: string,
    publicKey: CryptoKey,
    privateKey: WrappedPrivateKey
): Promise<User> {
    const address = await toAddress(publicKey)
    const user = new UserModel({
        username,
        passwordHash: await derivePassword(password),
        address,
        publicKey,
        privateKey,
    })
    await user.save()
    return user
}
