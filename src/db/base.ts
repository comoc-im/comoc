/**
 * Model Base Class
 * TODO:
 *  data security: encryption before persistence.
 */
export default abstract class Model<T> {

    protected static db: IDBDatabase
    private readonly storeName: string

    protected constructor (storeName: string) {
        this.storeName = storeName
    }

    static init (db: IDBDatabase): void {
        if (this.db !== db) {
            this.db = db
        }
    }

    protected static async getAll<T> (storeName: string): Promise<T[]> {

        return new Promise(resolve => {
            const trans = this.db.transaction([storeName], 'readonly')
            const req = trans.objectStore(storeName).getAll()

            req.onsuccess = () => resolve(req.result)
        })

    }


    /**
     * Read record with index
     * @param {String} index
     * @param {IDBValidKey | IDBKeyRange | null} query
     * @param {number} count
     * @return {Promise<Object>}
     */
    protected async getAllByIndex (index: string, query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<T[]> {

        return new Promise(resolve => {

            const trans = Model.db.transaction([this.storeName], 'readonly')
            const dbIndex = trans.objectStore(this.storeName).index(index)
            const req = dbIndex.getAll(query, count)

            req.onsuccess = () => resolve(req.result)

        })

    }


    /**
     * Put record
     * @return {Promise<String>}
     */
    protected async put (): Promise<string> {

        return new Promise((resolve, reject) => {

            const trans = Model.db.transaction([this.storeName], 'readwrite')
            const addReq = trans.objectStore(this.storeName).put(this)

            addReq.onerror = function (err: Event) {
                console.log('error storing data')
                console.error(err)
                reject()
            }

            trans.oncomplete = () => resolve(addReq.result as string)

        })

    }

}
