import {dbName, dbVersion} from "@/config";
import {initUser} from "@/db/user";

/**
 * Open and init indexedDB globally
 */
const dbReady: Promise<IDBDatabase> = new Promise(function (resolve, reject) {

    const request = indexedDB.open(dbName, dbVersion)

    request.onerror = function (err) {
        console.error('Unable to open database.', err)
        reject()
    }

    request.onsuccess = function () {
        const db = request.result
        console.log('db opened')
        resolve(db)
    }

    request.addEventListener('upgradeneeded', function () {
        const db = request.result
        initUser(db)
    })

})


/**
 * Model Base Class
 * TODO:
 *  data security: encryption before persistence.
 */
export default abstract class Model<T> {
    #storeName: string

    constructor (storeName: string) {
        this.#storeName = storeName
    }


    /**
     * Read record with index
     * @param {String} index
     * @param {IDBValidKey | IDBKeyRange | null} query
     * @param {number} count
     * @return {Promise<Object>}
     */
    protected async getAllByIndex (index: string, query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<T[]> {

        const db = await dbReady

        return new Promise(resolve => {

            const trans = db.transaction([this.#storeName], 'readonly')
            const dbIndex = trans.objectStore(this.#storeName).index(index)
            const req = dbIndex.getAll(query, count)

            req.onsuccess = () => resolve(req.result)

        })

    }


    /**
     * Put record
     * @return {Promise<String>}
     */
    protected async put (): Promise<string> {

        const db = await dbReady

        return new Promise((resolve, reject) => {

            const trans = db.transaction([this.#storeName], 'readwrite')
            const addReq = trans.objectStore(this.#storeName).put(this)

            addReq.onerror = function (e) {
                console.log('error storing data')
                console.error(e)
                reject()
            }

            trans.oncomplete = () => resolve(addReq.result as string)

        })

    }

}
