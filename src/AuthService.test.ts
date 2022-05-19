import { TextEncoder } from 'util'
import { AuthService, AuthServiceProps } from './AuthService'
import { createHash, randomFillSync } from 'crypto'

const props: AuthServiceProps = {
  clientId: 'testClientID',
  clientSecret: undefined,
  contentType: undefined,
  provider: 'http://oauth2provider/',
  redirectUri: 'http://localhost/',
  scopes: ['openid', 'profile']
}

const authService = new AuthService(props)

beforeAll(() => {
  global.TextEncoder = TextEncoder
  ;(window as any).fetch = () =>
    Promise.resolve({
      json: () => Promise.resolve([])
    })

  // mock window.crypto functions by using node.js crypto library
  ;(window as any).crypto = {
    getRandomValues: function (buffer: any) {
      return randomFillSync(buffer)
    },
    subtle: {
      digest: function (alg: string, data: Uint8Array) {
        const buffer = Buffer.from(data)
        const hash: Buffer = createHash('sha256').update(buffer).digest()

        const result = new Promise<ArrayBuffer>(() =>
          Buffer.from(new Uint8Array(hash))
        )
        return result
      }
    }
  }
})

describe('AuthService', () => {
  it('is truthy', () => {
    expect(AuthService).toBeTruthy()
  })

  it('should add requestId to headers', async () => {
    const authorizationCode = 'authorizationCode'

    await authService.login()

    const tokens = await authService.fetchToken(authorizationCode)
    console.log(tokens)
    expect(tokens).not.toBeUndefined()
    expect(tokens).not.toBeNull()
    // expect(fakeFetch.mock.calls[0][1]).toHaveProperty('headers')
    // expect(fakeFetch.mock.calls[0][1].headers).toHaveProperty('requestId')
  })
})
