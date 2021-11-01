import Web3 from 'web3'
import { debug, error } from '@/utils/logger'
import { notice } from '@/utils/notification'

export async function connect(): Promise<string | null> {
    try {
        const web3 = new Web3(window.ethereum)
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        const accounts = await web3.eth.getAccounts()
        debug('connected accounts', accounts)
        return accounts[0]
    } catch (err) {
        notice('connect account fail: ' + err)
        error('connect account fail', err)
        return null
    }
}
