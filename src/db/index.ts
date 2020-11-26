import {dbName, dbVersion} from "@/config";
import User from "@/db/user";
import Message from "@/db/message";

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
        User.init(db)
        Message.init(db)
    })

})

export default dbReady
