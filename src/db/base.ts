/**
 * Model Base Class
 * TODO:
 *  data security: encryption before persistence.
 */
import { error, log } from '@/utils/logger'
import { dbReady } from '@/db/index'

export async function getAll<T>(storeName: string): Promise<T[]> {
    const db = await dbReady
    return new Promise((resolve) => {
        const trans = db.transaction([storeName], 'readonly')
        const req = trans.objectStore(storeName).getAll()

        req.onsuccess = () => resolve(req.result)
    })
}

export async function getAllBy<T>(
    storeName: string,
    queryFunc: (item: T) => boolean
): Promise<T[]> {
    const db = await dbReady
    return new Promise((resolve) => {
        const trans = db.transaction([storeName], 'readonly')
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
export async function getAllByIndex<T>(
    storeName: string,
    index: string,
    query?: IDBValidKey | IDBKeyRange | null,
    count?: number
): Promise<T[]> {
    const db = await dbReady
    return new Promise((resolve) => {
        const trans = db.transaction([storeName], 'readonly')
        const dbIndex = trans.objectStore(storeName).index(index)
        const req = dbIndex.getAll(query, count)

        req.onsuccess = () => resolve(req.result)
    })
}

export async function collectByIndex<T>(
    storeName: string,
    indexName: Extract<keyof T, string>
): Promise<AsyncIterable<T>> {
    const db = await dbReady
    const trans = db.transaction([storeName], 'readonly')
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
export async function put<T>(storeName: string, data: T): Promise<string> {
    const db = await dbReady
    return new Promise((resolve, reject) => {
        const trans = db.transaction([storeName], 'readwrite')
        const addReq = trans.objectStore(storeName).put(data)

        addReq.onerror = function (err: Event) {
            log('error storing data')
            error(err)
            reject()
        }

        trans.oncomplete = () => resolve(addReq.result as string)
    })
}

/**
 * Delete record
 * @return {Promise<String>}
 */
export async function deleteMany<T>(
    storeName: string,
    queryFunc: (item: T) => boolean
): Promise<number> {
    const db = await dbReady
    return new Promise((resolve) => {
        const trans = db.transaction([storeName], 'readwrite')
        const os = trans.objectStore(storeName)
        const req = os.openCursor()
        let count = 0
        req.onsuccess = () => {
            const cursor = req.result
            if (cursor) {
                const match = queryFunc(cursor.value)
                if (match) {
                    count++
                    cursor.delete()
                }
                cursor.continue()
            } else {
                resolve(count)
            }
        }
    })
}
