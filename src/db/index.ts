const dbVersion = 1
const dbName = 'comoc'

export const accountStoreName = 'account'
export const messageStoreName = 'message'

export const dbReady: Promise<IDBDatabase> = new Promise(function (resolve, reject) {

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
        db.createObjectStore(accountStoreName)
        db.createObjectStore(messageStoreName)
    }

})

/**
 * read all keys
 * @param {String} storeName
 * @return {Promise<Array<string>>}
 */
export async function getAllKeys(storeName: string) {

    const db = await dbReady

    return new Promise(resolve => {

        const trans = db.transaction([storeName], 'readonly')
        const req = trans.objectStore(storeName).getAllKeys()

        req.onsuccess = () => resolve(req.result)

    })

}


/**
 * read record by key
 * @param {String} storeName
 * @param {String} key
 * @return {Promise<Object>}
 */
export async function getByKey(storeName: string, key: string) {

    const db = await dbReady

    return new Promise(resolve => {

        const trans = db.transaction([storeName], 'readonly')
        const req = trans.objectStore(storeName).get(key)

        req.onsuccess = () => resolve(req.result)

    })

}


/**
 * put record by key
 * @param {String} storeName
 * @param {String} key
 * @param {Object} payload
 * @return {Promise<String>}
 */
export async function putByKey(storeName: string, key: string, payload: unknown) {

    const db = await dbReady

    return new Promise((resolve, reject) => {

        const trans = db.transaction([storeName], 'readwrite')
        const addReq = trans.objectStore(storeName).put(payload, key)

        addReq.onerror = function (e) {
            console.log('error storing data')
            console.error(e)
            reject()
        }

        trans.oncomplete = () => resolve(addReq.result)

    })

}

/**
 * delete record by key
 * @param {String} storeName
 * @param {String} key
 * @return {Promise<Event>}
 */
export async function deleteByKey(storeName: string, key: string) {

    const db = await dbReady

    return new Promise(resolve => {

        const trans = db.transaction([storeName], 'readwrite')
        const req = trans.objectStore(storeName).delete(key)

        req.onsuccess = resolve

    })

}
