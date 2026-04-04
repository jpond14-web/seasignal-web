import { describe, it, expect } from 'vitest'
import * as routeModule from '../route'

// Smoke tests for the channel join route.
// Full integration tests would require mocking the Supabase client,
// but these verify the module structure and function signature.

describe('channels/join route', () => {
  it('exports a POST function', () => {
    expect(routeModule.POST).toBeDefined()
    expect(typeof routeModule.POST).toBe('function')
  })

  it('POST function accepts a Request argument', () => {
    // Verify the function signature has at least 1 parameter
    expect(routeModule.POST.length).toBeGreaterThanOrEqual(1)
  })
})
