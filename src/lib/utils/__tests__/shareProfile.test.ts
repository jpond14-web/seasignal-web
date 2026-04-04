import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateInviteLink } from '../shareProfile'

// The module reads window.location.origin at import time, but in jsdom
// the origin is "http://localhost" so the fallback logic works differently.
// We test generateInviteLink which uses the module-level APP_BASE_URL.

describe('generateInviteLink', () => {
  it('returns a URL with UTM params', () => {
    const link = generateInviteLink()
    expect(link).toContain('/register')
    expect(link).toContain('utm_source=invite')
    expect(link).toContain('utm_medium=referral')
    expect(link).toContain('utm_campaign=crew_invite')
  })

  it('returns a full URL (not a relative path)', () => {
    const link = generateInviteLink()
    expect(link).toMatch(/^https?:\/\//)
  })
})
