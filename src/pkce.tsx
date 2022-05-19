const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Source
 * - base64-arraybuffer library
 * - @see: https://github.com/niklasvh/base64-arraybuffer/blob/master/src/index.ts
 *   License: MIT (@see https://github.com/niklasvh/base64-arraybuffer/blob/master/LICENSE)
 *
 * @param arraybuffer buffer
 * @returns encoded string
 */
const encode = (arraybuffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(arraybuffer),
    len = bytes.length
  let base64 = ''

  for (let i = 0; i < len; i += 3) {
    base64 += chars[bytes[i] >> 2]
    base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)]
    base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)]
    base64 += chars[bytes[i + 2] & 63]
  }

  if (len % 3 === 2) {
    base64 = base64.substring(0, base64.length - 1) + '='
  } else if (len % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + '=='
  }

  return base64
}

const getRandomInt = (min: number, max: number): number => {
  // Create byte array and fill with 1 random number
  const byteArray = new Uint8Array(1)
  window.crypto.getRandomValues(byteArray)

  const range = max - min + 1
  const max_range = 256
  if (byteArray[0] >= Math.floor(max_range / range) * range)
    return getRandomInt(min, max)
  return min + (byteArray[0] % range)
}

export type PKCECodePair = {
  codeVerifier: string
  codeChallenge: Promise<string>
  createdAt: Date
}

export const base64URLEncode = (str: Buffer): string => {
  return str
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export const createPKCECodes = (): PKCECodePair => {
  const codeVerifier = `${getRandomInt(64, 256)}`
  const codeChallenge = generateCodeChallenge(codeVerifier)
  const createdAt = new Date()
  const codePair = {
    codeVerifier,
    codeChallenge,
    createdAt
  }
  return codePair
}

async function generateCodeChallenge(codeVerifier: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  const base64Digest = encode(digest)
  // you can extract this replacing code to a function
  return base64Digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
