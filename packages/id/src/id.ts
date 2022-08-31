import { exportKeyPair, parse, stringify } from './serialize'
import { sign, verify } from './usage'
import { toAddress } from './address'

export class CryptoID {
    public readonly privateKey: CryptoKey
    public readonly publicKey: CryptoKey
    private readonly exportPrivateKey: JsonWebKey
    private readonly exportPublicKey: JsonWebKey

    constructor(
        privateKey: CryptoKey,
        publicKey: CryptoKey,
        exportPrivateKey: JsonWebKey,
        exportPublicKey: JsonWebKey
    ) {
        this.privateKey = privateKey
        this.publicKey = publicKey
        this.exportPrivateKey = exportPrivateKey
        this.exportPublicKey = exportPublicKey
    }

    public get address() {
        return toAddress(this.publicKey)
    }

    public async sign(data: BufferSource): Promise<string> {
        return sign(this.privateKey, data)
    }

    public async verify(
        data: BufferSource,
        signature: string
    ): Promise<boolean> {
        return verify(this.publicKey, data, signature)
    }

    public toJSON(): string {
        return stringify(this.exportPrivateKey, this.exportPublicKey)
    }

    public toString(): string {
        return stringify(this.exportPrivateKey, this.exportPublicKey)
    }
}

export async function createId(): Promise<CryptoID> {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: 'ECDSA',
            namedCurve: 'P-384',
        },
        true,
        ['sign', 'verify']
    )
    const { exportPublicKey, exportPrivateKey } = await exportKeyPair(keyPair)

    return new CryptoID(
        keyPair.privateKey,
        keyPair.publicKey,
        exportPrivateKey,
        exportPublicKey
    )
}

export async function importId(source: string): Promise<CryptoID | null> {
    try {
        const parseResult = await parse(source)
        if (!parseResult) {
            return null
        }
        const { exportPublicKey, exportPrivateKey } = parseResult

        return new CryptoID(
            await window.crypto.subtle.importKey(
                'jwk',
                exportPrivateKey,
                {
                    name: 'ECDSA',
                    namedCurve: 'P-384',
                },
                true,
                ['sign']
            ),
            await window.crypto.subtle.importKey(
                'jwk',
                exportPublicKey,
                {
                    name: 'ECDSA',
                    namedCurve: 'P-384',
                },
                true,
                ['verify']
            ),
            exportPrivateKey,
            exportPublicKey
        )
    } catch (err) {
        return null
    }
}
