import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendEmail, newMessageEmail, certExpiryEmail, escapeHtml } from '../email'

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar')
  })

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('escapes quotes', () => {
    expect(escapeHtml('"double" & \'single\'')).toBe(
      '&quot;double&quot; &amp; &#39;single&#39;'
    )
  })

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('leaves safe strings unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
  })
})

describe('newMessageEmail', () => {
  it('returns HTML string containing sender name and channel', () => {
    const html = newMessageEmail({
      senderName: 'Captain Hook',
      channelName: 'MV Pacific',
      preview: 'Hello crew!',
    })

    expect(html).toContain('Captain Hook')
    expect(html).toContain('MV Pacific')
    expect(html).toContain('Hello crew!')
    expect(html).toContain('SeaSignal')
  })

  it('escapes HTML in user-provided data', () => {
    const html = newMessageEmail({
      senderName: '<script>alert("xss")</script>',
      channelName: 'Test & Channel',
      preview: '"quoted" <b>bold</b>',
    })

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('Test &amp; Channel')
    expect(html).toContain('&quot;quoted&quot;')
  })

  it('contains a link to messages', () => {
    const html = newMessageEmail({
      senderName: 'Test',
      channelName: 'Test',
      preview: 'Test',
    })
    expect(html).toContain('href="https://seasignal.app/messages"')
  })
})

describe('certExpiryEmail', () => {
  it('returns HTML with certificate details', () => {
    const html = certExpiryEmail({
      certTitle: 'STCW Basic Safety',
      expiryDate: '2024-06-15',
      daysLeft: 30,
    })

    expect(html).toContain('STCW Basic Safety')
    expect(html).toContain('2024-06-15')
    expect(html).toContain('30 days remaining')
  })

  it('uses red color for urgent expiry (7 days or less)', () => {
    const html = certExpiryEmail({
      certTitle: 'Test',
      expiryDate: '2024-01-01',
      daysLeft: 5,
    })
    expect(html).toContain('#ef4444')
  })

  it('uses amber color for moderate urgency (8-30 days)', () => {
    const html = certExpiryEmail({
      certTitle: 'Test',
      expiryDate: '2024-01-01',
      daysLeft: 15,
    })
    expect(html).toContain('#f59e0b')
  })

  it('uses teal color for low urgency (31+ days)', () => {
    const html = certExpiryEmail({
      certTitle: 'Test',
      expiryDate: '2024-01-01',
      daysLeft: 60,
    })
    expect(html).toContain('#0d9488')
  })

  it('handles singular "1 day remaining"', () => {
    const html = certExpiryEmail({
      certTitle: 'Test',
      expiryDate: '2024-01-01',
      daysLeft: 1,
    })
    expect(html).toContain('1 day remaining')
    expect(html).not.toContain('1 days remaining')
  })

  it('contains a link to certificates page', () => {
    const html = certExpiryEmail({
      certTitle: 'Test',
      expiryDate: '2024-01-01',
      daysLeft: 10,
    })
    expect(html).toContain('href="https://seasignal.app/career/certs"')
  })
})

describe('sendEmail', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    delete process.env.RESEND_API_KEY
  })

  it('returns success when no API key is set (graceful degradation)', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Hello</p>',
    })

    expect(result.success).toBe(true)
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('RESEND_API_KEY not set'))
  })

  it('calls Resend API when API key is set', async () => {
    process.env.RESEND_API_KEY = 'test-key-123'

    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'email-123' }), { status: 200 })
    )

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
    })

    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key-123',
        }),
      })
    )
  })

  it('returns error on API failure', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Rate limited', { status: 429 })
    )

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Hello</p>',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('429')
  })

  it('returns error on network failure', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Hello</p>',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })
})
