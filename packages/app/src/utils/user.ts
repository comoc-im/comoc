import { Address } from '@comoc/id'
import randomColor from 'randomcolor'

export function getUserColor(userAddress: Address): string {
    return randomColor({
        seed: userAddress,
        luminosity: 'dark',
    })
}
