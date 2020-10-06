import {MESSAGE_STORE_NAME, USER_STORE_NAME} from "@/db/store-names";
import {dbName, dbVersion} from "@/config";

/**
 * Model Base
 * TODO:
 *  data security: encryption before persistence.
 */
export default abstract class Model<T> {

    private static dbReady: Promise<IDBDatabase> = new Promise(function (resolve, reject) {

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

        request.onupgradeneeded = function () {
            const db = request.result
            db.createObjectStore(USER_STORE_NAME)
            db.createObjectStore(MESSAGE_STORE_NAME)
        }

    })


    #storeName: string

    constructor (storeName: string) {
        this.#storeName = storeName
    }


    /**
     * read all keys
     * @return {Promise<Array<string>>}
     */
    async getAllKeys () {

        const db = await Model.dbReady

        return new Promise(resolve => {

            const trans = db.transaction([this.#storeName], 'readonly')
            const req = trans.objectStore(this.#storeName).getAllKeys()

            req.onsuccess = () => resolve(req.result)

        })

    }


    /**
     * read record by key
     * @param {String} key
     * @return {Promise<Object>}
     */
    async getByKey (key: string): Promise<T | undefined> {

        const db = await Model.dbReady

        return new Promise(resolve => {

            const trans = db.transaction([this.#storeName], 'readonly')
            const req = trans.objectStore(this.#storeName).get(key)

            req.onsuccess = () => resolve(req.result)

        })

    }


    /**
     * put record by key
     * @param {String} key
     * @param {Object} payload
     * @return {Promise<String>}
     */
    async putByKey (key: string, payload: T): Promise<string> {

        const db = await Model.dbReady

        return new Promise((resolve, reject) => {

            const trans = db.transaction([this.#storeName], 'readwrite')
            const addReq = trans.objectStore(this.#storeName).put(payload, key)

            addReq.onerror = function (e) {
                console.log('error storing data')
                console.error(e)
                reject()
            }

            trans.oncomplete = () => resolve(addReq.result as string)

        })

    }

    /**
     * delete record by key
     * @param {String} key
     * @return {Promise<Event>}
     */
    async deleteByKey (key: string) {

        const db = await Model.dbReady

        return new Promise(resolve => {

            const trans = db.transaction([this.#storeName], 'readwrite')
            const req = trans.objectStore(this.#storeName).delete(key)

            req.onsuccess = resolve

        })

    }
}
