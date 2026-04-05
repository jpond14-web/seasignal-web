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
  /^\/intel\/companies/,
  /^\/intel\/vessels/,
  /^\/intel\/agencies/,
  /^\/community\/forums/,
  /^\/community\/seafarers/,
]

function isPublicRoute(pathname: string): boolean {
  return publicPatterns.some((pattern) => pattern.test(pathname))
}

describe('middleware public route patterns', () => {
  describe('public routes are correctly identified', () => {
    const publicRoutes = [
      '/',
      '/login',
      '/login?redirect=/home',
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
      // New hub public routes
      '/intel/companies',
      '/intel/companies/maersk',
      '/intel/vessels',
      '/intel/vessels/some-vessel',
      '/intel/agencies',
      '/intel/agencies/some-agency',
      '/community/forums',
      '/community/forums/general',
      '/community/seafarers',
      '/community/seafarers/some-user',
    ]

    for (const route of publicRoutes) {
      it(`"${route}" is public`, () => {
        expect(isPublicRoute(route)).toBe(true)
      })
    }
  })

  describe('private routes are not matched by public patterns', () => {
    const privateRoutes = [
      '/home',
      '/messages',
      '/messages/conv-123',
      '/settings',
      '/career/certs',
      '/career/sea-time',
      '/career/jobs',
      '/profile',
      '/community/stories',
      '/community/mentors',
      '/intel/alerts',
      '/intel/guides',
      '/welfare/incidents',
      '/welfare/rights',
      '/welfare/emergency',
      '/welfare/mental-health',
      '/welfare/mlc',
      '/admin',
      '/admin/users',
    ]

    for (const route of privateRoutes) {
      it(`"${route}" is private`, () => {
        expect(isPublicRoute(route)).toBe(false)
      })
    }
  })
})
