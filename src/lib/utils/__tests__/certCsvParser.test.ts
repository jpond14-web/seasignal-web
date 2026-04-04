import { describe, it, expect } from 'vitest'
import { parseCertCsv, type ParsedCertRow } from '../certCsvParser'

describe('parseCertCsv', () => {
  it('parses a valid CSV with header row', () => {
    const csv = `cert_type,title,cert_number,issuing_authority,flag_state,issue_date,expiry_date
stcw,Basic Safety Training,BST-1234,MCA,GBR,2024-01-15,2029-01-15`

    const result = parseCertCsv(csv)
    expect(result.errors).toHaveLength(0)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0]).toEqual<ParsedCertRow>({
      cert_type: 'stcw',
      title: 'Basic Safety Training',
      cert_number: 'BST-1234',
      issuing_authority: 'MCA',
      flag_state: 'GBR',
      issue_date: '2024-01-15',
      expiry_date: '2029-01-15',
    })
  })

  it('parses a valid CSV without header row', () => {
    const csv = `medical,ENG1 Medical,MED-99,MCA,GBR,2024-06-01,2026-06-01`
    const result = parseCertCsv(csv)
    expect(result.errors).toHaveLength(0)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].cert_type).toBe('medical')
  })

  it('parses multiple rows', () => {
    const csv = `stcw,BST,,,,,
coc,Master 3000GT,COC-123,MCA,GBR,2023-01-01,2028-01-01
visa,Schengen Visa,,Embassy,,2024-01-01,2025-01-01`

    const result = parseCertCsv(csv)
    expect(result.errors).toHaveLength(0)
    expect(result.valid).toHaveLength(3)
  })

  it('rejects invalid cert_type', () => {
    const csv = `invalid_type,Some Title`
    const result = parseCertCsv(csv)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('Invalid cert_type')
  })

  it('accepts all valid cert_types', () => {
    const validTypes = ['coc', 'stcw', 'medical', 'visa', 'endorsement', 'short_course', 'flag_state', 'gmdss', 'other']
    const csv = validTypes.map(t => `${t},Title for ${t}`).join('\n')
    const result = parseCertCsv(csv)
    expect(result.errors).toHaveLength(0)
    expect(result.valid).toHaveLength(validTypes.length)
  })

  it('rejects rows missing required title', () => {
    const csv = `stcw,`
    const result = parseCertCsv(csv)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('title is required')
  })

  it('rejects rows missing cert_type', () => {
    const csv = `,Some Title`
    const result = parseCertCsv(csv)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('cert_type is required')
  })

  it('rejects rows with too few columns', () => {
    const csv = `stcw`
    const result = parseCertCsv(csv)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('at least 2 columns')
  })

  it('rejects invalid issue_date format', () => {
    const csv = `stcw,BST,,,,,2024-13-01`
    // issue_date is at index 5, expiry_date is at index 6
    // Let's put the bad date in issue_date position
    const csv2 = `stcw,BST,num,auth,flag,01/15/2024,2029-01-01`
    const result = parseCertCsv(csv2)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('Invalid issue_date')
  })

  it('rejects invalid expiry_date format', () => {
    const csv = `stcw,BST,num,auth,flag,2024-01-15,not-a-date`
    const result = parseCertCsv(csv)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('Invalid expiry_date')
  })

  it('accepts rows with optional fields empty', () => {
    const csv = `stcw,BST`
    const result = parseCertCsv(csv)
    expect(result.errors).toHaveLength(0)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].cert_number).toBe('')
    expect(result.valid[0].issue_date).toBe('')
    expect(result.valid[0].expiry_date).toBe('')
  })

  it('returns error for empty input', () => {
    const result = parseCertCsv('')
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].row).toBe(0)
    expect(result.errors[0].message).toContain('empty')
  })

  it('returns error for whitespace-only input', () => {
    const result = parseCertCsv('   \n  \n  ')
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('empty')
  })

  it('handles quoted CSV values', () => {
    const csv = `"stcw","Basic Safety Training","BST-1234","MCA","GBR","2024-01-15","2029-01-15"`
    const result = parseCertCsv(csv)
    expect(result.errors).toHaveLength(0)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].cert_type).toBe('stcw')
    expect(result.valid[0].title).toBe('Basic Safety Training')
  })

  it('normalizes cert_type to lowercase', () => {
    const csv = `STCW,Basic Safety Training`
    const result = parseCertCsv(csv)
    expect(result.errors).toHaveLength(0)
    expect(result.valid[0].cert_type).toBe('stcw')
  })

  it('mixes valid and invalid rows, reporting errors with correct row numbers', () => {
    const csv = `cert_type,title
stcw,BST
invalid_type,Bad Cert
medical,ENG1`

    const result = parseCertCsv(csv)
    expect(result.valid).toHaveLength(2)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].row).toBe(3) // 1-based, row 3 is "invalid_type"
  })
})
