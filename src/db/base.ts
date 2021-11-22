/**
 * Model Base Class
 * TODO:
 *  data security: encryption before persistence.
 */
import { error, log } from '@/utils/logger'

export default abstract class Model {
    protected static db: IDBDatabase
    private readonly storeName: string

    protected constructor(storeName: string) {
        this.storeName = storeName
    }

    static init(db: IDBDatabase): void {
        if (this.db !== db) {
            this.db = db
        }
    }

    protected static async getAll<T>(storeName: string): Promise<T[]> {
        return new Promise((resolve) => {
            const trans = this.db.transaction([storeName], 'readonly')
            const req = trans.objectStore(storeName).getAll()

            req.onsuccess = () => resolve(req.result)
        })
    }

    protected static async getAllBy<T>(
        storeName: string,
        queryFunc: (item: T) => boolean
    ): Promise<T[]> {
        return new Promise((resolve) => {
            const trans = this.db.transaction([storeName], 'readonly')
            const os = trans.objectStore(storeName)
            const req = os.openCursor()
            const result: T[] = []
            req.onsuccess = () => {
                const cursor = req.result
                if (cursor) {
                    const match = queryFunc(cursor.value)
                    if (match) {
                        result.push(cursor.value)
                    }
                    cursor.continue()
                } else {
                    resolve(result)
                }
            }
        })
    }

    /**
     * Read record with index
     * @param {String} storeName
     * @param {String} index
     * @param {IDBValidKey | IDBKeyRange | null} query
     * @param {number} count
     * @return {Promise<Object>}
     */
    protected static async getAllByIndex<T extends Model>(
        storeName: string,
        index: string,
        query?: IDBValidKey | IDBKeyRange | null,
        count?: number
    ): Promise<T[]> {
        return new Promise((resolve) => {
            const trans = Model.db.transaction([storeName], 'readonly')
            const dbIndex = trans.objectStore(storeName).index(index)
            const req = dbIndex.getAll(query, count)

            req.onsuccess = () => resolve(req.result)
        })
    }

    protected static collectByIndex<T>(
        storeName: string,
        indexName: Extract<keyof T, string>
    ): AsyncIterable<T> {
        const trans = Model.db.transaction([storeName], 'readonly')
        const index = trans.objectStore(storeName).index(indexName)
        const req = index.openCursor()
        return {
            [Symbol.asyncIterator]: () => ({
                next: () =>
                    new Promise(function (resolve) {
                        req.onsuccess = () => {
                            if (req.result) {
                                resolve({ value: req.result.value })
                                req.result.continue()
                            } else {
                                resolve({ done: true, value: undefined })
                            }
                        }
                    }),
            }),
        }
    }

    /**
     * Put record
     * @return {Promise<String>}
     */
    protected async put(): Promise<string> {
        return new Promise((resolve, reject) => {
            const trans = Model.db.transaction([this.storeName], 'readwrite')
            const addReq = trans.objectStore(this.storeName).put(this)

            addReq.onerror = function (err: Event) {
                log('error storing data')
                error(err)
                reject()
            }

            trans.oncomplete = () => resolve(addReq.result as string)
        })
    }
}
