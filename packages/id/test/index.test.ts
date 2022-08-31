import { describe, expect, test } from 'vitest'
import { CryptoID } from 'src'
import { createId } from 'src/id'

describe('CryptoID', () => {
    test('base', async () => {
        expect(CryptoID).toBeDefined()
        const id = await createId()
        expect(id).toBeInstanceOf(CryptoID)
    })
})
