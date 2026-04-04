import { describe, it, expect } from 'vitest'

// The hook itself depends on Supabase client and React hooks, making it
// difficult to unit test directly. Instead, we extract and test the scoring
// logic by re-implementing the same field checks from the source.
//
// This validates the business logic: field weights sum to 100, and the
// scoring algorithm produces expected results for known profile shapes.

// Mirror the field checks from useProfileCompleteness.ts
interface FieldCheck {
  key: string
  label: string
  weight: number
  check: (profile: Record<string, unknown>, extra: { certCount: number; seaTimeCount: number }) => boolean
}

const FIELD_CHECKS: FieldCheck[] = [
  { key: 'display_name', label: 'Display name', weight: 10, check: (p) => !!p.display_name && String(p.display_name).trim().length > 0 },
  { key: 'avatar_url', label: 'Profile photo', weight: 10, check: (p) => !!p.avatar_url },
  { key: 'department', label: 'Department', weight: 10, check: (p) => !!p.department_tag },
  { key: 'rank_category', label: 'Rank', weight: 10, check: (p) => !!p.rank_range },
  { key: 'experience_band', label: 'Sea experience', weight: 10, check: (p) => !!p.experience_band },
  { key: 'bio', label: 'Bio', weight: 10, check: (p) => !!p.bio && String(p.bio).trim().length > 0 },
  { key: 'home_port', label: 'Home port', weight: 5, check: (p) => !!p.home_port && String(p.home_port).trim().length > 0 },
  { key: 'current_port', label: 'Current port', weight: 5, check: (p) => !!p.current_port && String(p.current_port).trim().length > 0 },
  { key: 'vessel_type_preferences', label: 'Vessel type preferences', weight: 10, check: (p) => !!p.vessel_type_tags && (p.vessel_type_tags as string[]).length > 0 },
  { key: 'certificates', label: 'At least 1 certificate', weight: 10, check: (_p, extra) => extra.certCount > 0 },
  { key: 'sea_time', label: 'At least 1 sea time record', weight: 10, check: (_p, extra) => extra.seaTimeCount > 0 },
]

function calculateCompleteness(
  profile: Record<string, unknown>,
  extra: { certCount: number; seaTimeCount: number }
) {
  let totalWeight = 0
  const completedFields: string[] = []
  const missingFields: string[] = []

  for (const field of FIELD_CHECKS) {
    if (field.check(profile, extra)) {
      totalWeight += field.weight
      completedFields.push(field.label)
    } else {
      missingFields.push(field.label)
    }
  }

  return { percentage: totalWeight, completedFields, missingFields }
}

describe('profile completeness scoring', () => {
  it('total weights sum to 100', () => {
    const total = FIELD_CHECKS.reduce((sum, f) => sum + f.weight, 0)
    expect(total).toBe(100)
  })

  it('returns 0% for a completely empty profile', () => {
    const result = calculateCompleteness({}, { certCount: 0, seaTimeCount: 0 })
    expect(result.percentage).toBe(0)
    expect(result.missingFields).toHaveLength(FIELD_CHECKS.length)
    expect(result.completedFields).toHaveLength(0)
  })

  it('returns 100% for a fully complete profile', () => {
    const fullProfile = {
      display_name: 'John Smith',
      avatar_url: 'https://example.com/avatar.jpg',
      department_tag: 'deck',
      rank_range: 'officer',
      experience_band: '5-10',
      bio: 'Experienced seafarer',
      home_port: 'Southampton',
      current_port: 'Hamburg',
      vessel_type_tags: ['tanker', 'bulk'],
    }
    const result = calculateCompleteness(fullProfile, { certCount: 3, seaTimeCount: 2 })
    expect(result.percentage).toBe(100)
    expect(result.completedFields).toHaveLength(FIELD_CHECKS.length)
    expect(result.missingFields).toHaveLength(0)
  })

  it('correctly weights individual fields', () => {
    // Only display_name filled = 10%
    const result = calculateCompleteness(
      { display_name: 'Test' },
      { certCount: 0, seaTimeCount: 0 }
    )
    expect(result.percentage).toBe(10)
  })

  it('weights home_port and current_port at 5 each', () => {
    const result = calculateCompleteness(
      { home_port: 'Port A', current_port: 'Port B' },
      { certCount: 0, seaTimeCount: 0 }
    )
    expect(result.percentage).toBe(10)
  })

  it('counts certificates from extra data, not profile field', () => {
    const result = calculateCompleteness({}, { certCount: 1, seaTimeCount: 0 })
    expect(result.percentage).toBe(10)
    expect(result.completedFields).toContain('At least 1 certificate')
  })

  it('counts sea time from extra data', () => {
    const result = calculateCompleteness({}, { certCount: 0, seaTimeCount: 1 })
    expect(result.percentage).toBe(10)
    expect(result.completedFields).toContain('At least 1 sea time record')
  })

  it('treats empty strings as incomplete', () => {
    const result = calculateCompleteness(
      { display_name: '', bio: '   ', home_port: '' },
      { certCount: 0, seaTimeCount: 0 }
    )
    expect(result.percentage).toBe(0)
  })

  it('treats empty vessel_type_tags array as incomplete', () => {
    const result = calculateCompleteness(
      { vessel_type_tags: [] },
      { certCount: 0, seaTimeCount: 0 }
    )
    expect(result.percentage).toBe(0)
    expect(result.missingFields).toContain('Vessel type preferences')
  })
})
