import { Address, toAddress } from '@comoc/id'
import { StoreNames } from '@/db/store-names'
import { derivePassword } from '@/db/user/crypto'
import { WrappedPrivateKey } from '@/id'
import { deleteMany, getAll, put } from '@/db/base'

export interface User {
    username: string
    address: Address
    passwordHash: string
    publicKey: CryptoKey
    privateKey: WrappedPrivateKey
}

export class UserModel implements User {
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
            db.deleteObjectStore(StoreNames.USER)
        } catch (err) {
            //
        }
        const userStore = db.createObjectStore(StoreNames.USER, {
            autoIncrement: true,
        })
        userStore.createIndex('username', 'username', { unique: false })
        userStore.createIndex('address', 'address', { unique: true })
    }

    static async findAll(): Promise<User[]> {
        return getAll<User>(StoreNames.USER)
    }

    public static async delete(user: User): Promise<void> {
        await deleteMany<UserModel>(
            StoreNames.USER,
            (u) => u.address == user.address
        )
    }

    async save(): Promise<void> {
        await put(StoreNames.USER, this)
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
