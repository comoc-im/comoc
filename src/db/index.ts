import { dbName, dbVersion } from '@/config'
import { UserModel } from '@/db/user'
import Model from '@/db/base'
import { debug, error } from '@/utils/logger'
import { ContactModel } from '@/db/contact'
import { MessageModel } from '@/db/message'

/**
 * Open and init indexedDB globally
 */
const dbReady: Promise<IDBDatabase> = new Promise(function (resolve, reject) {
    const request = indexedDB.open(dbName, dbVersion)

    request.onerror = function (err) {
        error('Unable to open database.', err)
        reject()
    }

    request.onsuccess = function () {
        const db = request.result
        debug('db opened')
        Model.init(db)
        resolve(db)
    }

    request.addEventListener('upgradeneeded', function () {
        debug('upgradeneeded')
        const db = request.result
        UserModel.init(db)
        MessageModel.init(db)
        ContactModel.init(db)
    })
})

export default dbReady
