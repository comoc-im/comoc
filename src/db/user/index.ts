import {USER_STORE_NAME} from "@/db/store-names";
import {derivePasswordKey} from "@/db/user/crypto";
import Model from "@/db/base";


export default class User extends Model<User> {

    static async find (username: string, password: string): Promise<User | null> {
        const user = new User(username, password)
        await user.ready()

        const accountInDB = await user.getByKey(user.dbKey)
        if (!accountInDB) {
            return null
        }

        return user
    }

    username: string
    #passwordKey: string | null = null
    #passwordDerivingPromise: Promise<string>

    get dbKey (): string {
        return this.username + '___' + this.#passwordKey
    }

    constructor (username: string, password: string) {
        super(USER_STORE_NAME)

        this.username = username
        this.#passwordDerivingPromise = derivePasswordKey(password)
    }

    private async ready () {
        if (this.#passwordKey === null) {
            this.#passwordKey = await this.#passwordDerivingPromise
        }
        return this.#passwordKey
    }


    async checkPassword (passwordProvided: string): Promise<boolean> {
        const key = await derivePasswordKey(passwordProvided)
        await this.ready()

        return key === this.#passwordKey
    }

    async save (): Promise<boolean> {
        await this.ready()
        await this.putByKey(this.dbKey, this)

        return true
    }

}
