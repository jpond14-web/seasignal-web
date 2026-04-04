import { describe, it, expect } from 'vitest'
import { parseSeaTimeCsv, type ParsedRow } from '../csvParser'

describe('parseSeaTimeCsv', () => {
  it('parses a valid CSV row', () => {
    const csv = 'tanker,Chief Officer,180,2023-01-01,2023-06-30,Good voyage'
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(errors).toHaveLength(0)
    expect(valid).toHaveLength(1)
    expect(valid[0]).toEqual({
      vessel_type: 'tanker',
      rank_held: 'Chief Officer',
      days: 180,
      start_date: '2023-01-01',
      end_date: '2023-06-30',
      notes: 'Good voyage',
    })
  })

  it('skips header row when present', () => {
    const csv = `vessel_type,rank_held,days,start_date,end_date,notes
bulk_carrier,Master,90,2023-03-01,2023-05-30,`
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(errors).toHaveLength(0)
    expect(valid).toHaveLength(1)
    expect(valid[0].vessel_type).toBe('bulk_carrier')
  })

  it('skips quoted header row', () => {
    const csv = `"vessel_type","rank_held","days","start_date","end_date","notes"
container,AB,60,2023-01-01,2023-03-01,`
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(errors).toHaveLength(0)
    expect(valid).toHaveLength(1)
  })

  it('returns error for empty input', () => {
    const { valid, errors } = parseSeaTimeCsv('')
    expect(valid).toHaveLength(0)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toBe('File is empty')
  })

  it('returns error for too few columns', () => {
    const csv = 'tanker,Master,90'
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(valid).toHaveLength(0)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Expected at least 5 columns')
  })

  it('returns error for invalid vessel type', () => {
    const csv = 'submarine,Captain,30,2023-01-01,2023-01-31,'
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(valid).toHaveLength(0)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Invalid vessel type')
  })

  it('returns error for non-positive days', () => {
    const csv = 'tanker,Master,0,2023-01-01,2023-01-31,'
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(valid).toHaveLength(0)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Days must be a positive integer')
  })

  it('returns error for non-numeric days', () => {
    const csv = 'tanker,Master,abc,2023-01-01,2023-01-31,'
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(valid).toHaveLength(0)
    expect(errors[0].message).toContain('Days must be a positive integer')
  })

  it('returns error for invalid start_date', () => {
    const csv = 'tanker,Master,30,01-01-2023,2023-01-31,'
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(valid).toHaveLength(0)
    expect(errors[0].message).toContain('Invalid start_date')
  })

  it('returns error for invalid end_date', () => {
    const csv = 'tanker,Master,30,2023-01-01,not-a-date,'
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(valid).toHaveLength(0)
    expect(errors[0].message).toContain('Invalid end_date')
  })

  it('handles multiple rows with mixed valid and invalid', () => {
    const csv = `tanker,Master,90,2023-01-01,2023-03-31,
invalid_type,AB,30,2023-04-01,2023-04-30,
lng,Engineer,60,2023-05-01,2023-06-30,`
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(valid).toHaveLength(2)
    expect(errors).toHaveLength(1)
    expect(valid[0].vessel_type).toBe('tanker')
    expect(valid[1].vessel_type).toBe('lng')
  })

  it('handles Windows-style line endings', () => {
    const csv = 'tanker,Master,90,2023-01-01,2023-03-31,\r\nlng,AB,30,2023-04-01,2023-04-30,'
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(errors).toHaveLength(0)
    expect(valid).toHaveLength(2)
  })

  it('vessel type is case-insensitive', () => {
    const csv = 'TANKER,Master,90,2023-01-01,2023-03-31,'
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(errors).toHaveLength(0)
    expect(valid).toHaveLength(1)
    expect(valid[0].vessel_type).toBe('tanker')
  })

  it('handles row with no notes column', () => {
    const csv = 'tanker,Master,90,2023-01-01,2023-03-31'
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(errors).toHaveLength(0)
    expect(valid).toHaveLength(1)
    expect(valid[0].notes).toBe('')
  })

  it('strips surrounding quotes from fields', () => {
    const csv = '"offshore","Captain","45","2023-01-01","2023-02-14","Drill ship"'
    const { valid, errors } = parseSeaTimeCsv(csv)
    expect(errors).toHaveLength(0)
    expect(valid).toHaveLength(1)
    expect(valid[0].vessel_type).toBe('offshore')
    expect(valid[0].rank_held).toBe('Captain')
  })

  it('accepts all valid vessel types', () => {
    const types = [
      'tanker', 'bulk_carrier', 'container', 'general_cargo', 'offshore',
      'passenger', 'roro', 'lng', 'lpg', 'chemical', 'reefer', 'tug',
      'fishing', 'other',
    ]
    for (const type of types) {
      const csv = `${type},AB,30,2023-01-01,2023-01-31,`
      const { valid, errors } = parseSeaTimeCsv(csv)
      expect(errors).toHaveLength(0)
      expect(valid).toHaveLength(1)
    }
  })
})
