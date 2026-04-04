import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase server client before importing route
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockLimit = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

// Build chainable query mock
function setupChain(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  return chain
}

import { POST } from '../route'

describe('channels/join route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports a POST function', () => {
    expect(POST).toBeDefined()
    expect(typeof POST).toBe('function')
  })

  it('POST function is async (accepts a Request argument)', () => {
    expect(POST.length).toBeGreaterThanOrEqual(1)
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const request = new Request('http://localhost/api/channels/join', {
      method: 'POST',
      body: JSON.stringify({ conversationId: 'test-conv' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 400 when request body is not valid JSON', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const request = new Request('http://localhost/api/channels/join', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'text/plain' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid JSON')
  })

  it('returns 400 when conversationId is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    // Mock profile query chain
    const profileChain = setupChain(null)
    mockFrom.mockReturnValue(profileChain)

    const request = new Request('http://localhost/api/channels/join', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('conversationId required')
  })

  it('returns a Response object', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const request = new Request('http://localhost/api/channels/join', {
      method: 'POST',
      body: JSON.stringify({ conversationId: 'test' }),
    })

    const response = await POST(request)
    expect(response).toBeInstanceOf(Response)
  })
})
