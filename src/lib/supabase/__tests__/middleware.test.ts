import { describe, it, expect } from 'vitest'

// Test the public route patterns from the middleware directly.
// We extract the same regex array used in updateSession to verify
// route classification without needing to import the full middleware
// (which depends on Next.js server internals and Supabase SSR).

const publicPatterns = [
  /^\/$/,
  /^\/login/,
  /^\/signup/,
  /^\/callback/,
  /^\/api\/.*/,
  /^\/_next\/.*/,
  /^\/favicon\.ico$/,
  /^\/manifest\.json$/,
  /^\/sw\.js$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
  /^\/offline\.html$/,
  /^\/icons\/.*/,
  /^\/privacy/,
  /^\/terms/,
  /^\/about/,
  /^\/contact/,
  /^\/companies/,
]

function isPublicRoute(pathname: string): boolean {
  return publicPatterns.some((pattern) => pattern.test(pathname))
}

describe('middleware public route patterns', () => {
  describe('public routes are correctly identified', () => {
    const publicRoutes = [
      '/',
      '/login',
      '/login?redirect=/dashboard',
      '/signup',
      '/signup/verify',
      '/callback',
      '/api/channels/join',
      '/api/export',
      '/_next/static/chunk.js',
      '/favicon.ico',
      '/manifest.json',
      '/sw.js',
      '/robots.txt',
      '/sitemap.xml',
      '/offline.html',
      '/icons/icon-192.png',
      '/privacy',
      '/privacy/cookie-policy',
      '/terms',
      '/about',
      '/contact',
      '/companies',
      '/companies/maersk',
    ]

    for (const route of publicRoutes) {
      it(`"${route}" is public`, () => {
        expect(isPublicRoute(route)).toBe(true)
      })
    }
  })

  describe('private routes are not matched by public patterns', () => {
    const privateRoutes = [
      '/dashboard',
      '/messages',
      '/messages/conv-123',
      '/settings',
      '/certs',
      '/sea-time',
      '/profile',
      '/seafarers/find-crew',
      '/contract-check',
    ]

    for (const route of privateRoutes) {
      it(`"${route}" is private`, () => {
        expect(isPublicRoute(route)).toBe(false)
      })
    }
  })
})
