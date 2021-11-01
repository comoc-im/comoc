import BaseProvider from '@metamask/providers/dist/BaseProvider'
import { AbstractProvider } from 'web3-core'

declare global {
    interface Window {
        ethereum: BaseProvider & AbstractProvider
    }
}
