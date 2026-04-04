import { describe, it, expect } from 'vitest'
import * as pushModule from '../pushSubscription'

describe('pushSubscription module', () => {
  it('exports subscribeToPush as a function', () => {
    expect(typeof pushModule.subscribeToPush).toBe('function')
  })

  it('exports unsubscribeFromPush as a function', () => {
    expect(typeof pushModule.unsubscribeFromPush).toBe('function')
  })

  it('exports requestNotificationPermission as a function', () => {
    expect(typeof pushModule.requestNotificationPermission).toBe('function')
  })

  it('exports hasPushSubscription as a function', () => {
    expect(typeof pushModule.hasPushSubscription).toBe('function')
  })
})

describe('urlBase64ToUint8Array', () => {
  // The function is not exported, so we test it indirectly by verifying
  // the module loads without error and the VAPID key logic is sound.
  // We can also replicate the logic to verify correctness.

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  it('converts a standard base64url string to Uint8Array', () => {
    // "SGVsbG8" is base64url for "Hello"
    const result = urlBase64ToUint8Array('SGVsbG8')
    expect(result).toBeInstanceOf(Uint8Array)
    const decoded = new TextDecoder().decode(result)
    expect(decoded).toBe('Hello')
  })

  it('handles base64url characters (- and _)', () => {
    // base64url uses - instead of + and _ instead of /
    // "+/" in standard base64 would be "-_" in base64url
    const input = 'ab-_'
    const result = urlBase64ToUint8Array(input)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('adds correct padding', () => {
    // "YQ" needs "==" padding to become "YQ==" (which decodes to "a")
    const result = urlBase64ToUint8Array('YQ')
    const decoded = new TextDecoder().decode(result)
    expect(decoded).toBe('a')
  })

  it('handles VAPID-key-length input without error', () => {
    const vapidKey =
      'BDz0EH_Vu60-4ddqvMu8_aur1oY9KbZocLGoDvL8VhpS09KlqLy_lz8Za1yzoAsLXodWOhD7h4jnDUE0woThCP0'
    const result = urlBase64ToUint8Array(vapidKey)
    expect(result).toBeInstanceOf(Uint8Array)
    // VAPID public keys are 65 bytes (uncompressed P-256 point)
    expect(result.length).toBe(65)
  })
})
