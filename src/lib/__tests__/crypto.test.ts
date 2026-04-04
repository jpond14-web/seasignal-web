import { describe, it, expect, beforeEach, vi } from 'vitest'

// Web Crypto API is available in Node 20+ (used by vitest), but jsdom may
// not expose it on globalThis.crypto.subtle. If it's missing we skip.
const hasSubtle = typeof globalThis.crypto?.subtle?.generateKey === 'function'

const describeIfCrypto = hasSubtle ? describe : describe.skip

describeIfCrypto('crypto utilities', () => {
  let encrypt: typeof import('../crypto').encrypt
  let decrypt: typeof import('../crypto').decrypt
  let generateConversationKey: typeof import('../crypto').generateConversationKey
  let exportKey: typeof import('../crypto').exportKey
  let importKey: typeof import('../crypto').importKey
  let getOrCreateConversationKey: typeof import('../crypto').getOrCreateConversationKey

  beforeEach(async () => {
    const mod = await import('../crypto')
    encrypt = mod.encrypt
    decrypt = mod.decrypt
    generateConversationKey = mod.generateConversationKey
    exportKey = mod.exportKey
    importKey = mod.importKey
    getOrCreateConversationKey = mod.getOrCreateConversationKey
  })

  it('encrypt/decrypt round-trip returns original plaintext', async () => {
    const key = await generateConversationKey()
    const plaintext = 'Ahoy, captain! Meeting at 0800.'
    const ciphertext = await encrypt(plaintext, key)
    const result = await decrypt(ciphertext, key)
    expect(result).toBe(plaintext)
  })

  it('encrypted text differs from plaintext', async () => {
    const key = await generateConversationKey()
    const plaintext = 'Sensitive crew data'
    const ciphertext = await encrypt(plaintext, key)
    expect(ciphertext).not.toBe(plaintext)
  })

  it('decrypt with wrong key throws', async () => {
    const key1 = await generateConversationKey()
    const key2 = await generateConversationKey()
    const ciphertext = await encrypt('secret message', key1)
    await expect(decrypt(ciphertext, key2)).rejects.toThrow()
  })

  it('exportKey and importKey round-trip preserves the key', async () => {
    const key = await generateConversationKey()
    const exported = await exportKey(key)
    const reimported = await importKey(exported)
    const plaintext = 'Round-trip key test'
    const ciphertext = await encrypt(plaintext, key)
    const result = await decrypt(ciphertext, reimported)
    expect(result).toBe(plaintext)
  })

  it('getOrCreateConversationKey returns a CryptoKey', async () => {
    const key = await getOrCreateConversationKey('test-conv-123')
    expect(key).toBeDefined()
    expect(key.type).toBe('secret')
    expect(key.algorithm).toMatchObject({ name: 'AES-GCM' })
  })

  it('getOrCreateConversationKey returns same key on second call', async () => {
    const key1 = await getOrCreateConversationKey('test-conv-456')
    const key2 = await getOrCreateConversationKey('test-conv-456')
    const exported1 = await exportKey(key1)
    const exported2 = await exportKey(key2)
    expect(exported1).toBe(exported2)
  })
})
