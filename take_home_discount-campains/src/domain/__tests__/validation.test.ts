import { describe, expect, it } from 'vitest'
import { calculateDiscount } from '../calculateDiscount'
import { DiscountValidationError } from '../errors'
import { parseDiscountInput } from '../validation'

const validItem = { id: 'tshirt', name: 'T-Shirt', category: 'Clothing', price: 350, quantity: 1 }

const issuesOf = (cart: unknown, campaigns: unknown = []): string[] => {
  try {
    parseDiscountInput(cart, campaigns)
  } catch (error) {
    if (error instanceof DiscountValidationError) return error.issues
    throw error
  }
  return []
}

describe('top-level input', () => {
  it.each([null, undefined, 'cart', 42, {}])('rejects cart = %j', (cart) => {
    expect(issuesOf(cart)).toContain('cart must be an array of items')
  })

  it.each([null, undefined, { type: 'POINTS' }])('rejects campaigns = %j', (campaigns) => {
    expect(() => parseDiscountInput([], campaigns)).toThrow('campaigns must be an array')
  })

  it('accepts valid input', () => {
    expect(issuesOf([validItem], [{ type: 'POINTS', points: 10 }])).toEqual([])
  })
})

describe('cart items', () => {
  it.each([
    ['null item', null, 'cart[0] must be an object'],
    ['missing name', { ...validItem, name: '' }, 'cart[0].name must be a non-empty string'],
    ['unknown category', { ...validItem, category: 'Food' }, 'cart[0].category must be one of'],
    ['negative price', { ...validItem, price: -1 }, 'cart[0].price'],
    ['price as string', { ...validItem, price: '350' }, 'cart[0].price'],
    ['NaN price', { ...validItem, price: Number.NaN }, 'cart[0].price'],
    ['Infinity price', { ...validItem, price: Infinity }, 'cart[0].price'],
    ['zero quantity', { ...validItem, quantity: 0 }, 'cart[0].quantity'],
    ['fractional quantity', { ...validItem, quantity: 1.5 }, 'cart[0].quantity'],
  ])('rejects %s', (_, raw, expected) => {
    expect(issuesOf([raw]).join('\n')).toContain(expected)
  })

  it('defaults quantity to 1 and drops unknown fields', () => {
    const { id, name, category, price } = validItem
    const { items } = parseDiscountInput([{ id, name, category, price, color: 'red' }], [])
    expect(items).toEqual([{ id, name, category, price, quantity: 1 }])
  })

  it('accepts free items', () => {
    expect(calculateDiscount([{ ...validItem, price: 0 }], []).finalPrice).toBe(0)
  })
})

describe('campaigns', () => {
  it.each([
    ['null', null, 'campaigns[0] must be an object'],
    ['unknown type', { type: 'BOGO' }, 'campaigns[0].type must be one of'],
    ['prototype key as type', { type: 'toString' }, 'campaigns[0].type must be one of'],
    ['zero fixed amount', { type: 'FIXED_AMOUNT', amount: 0 }, 'amount must be greater than 0'],
    ['negative fixed amount', { type: 'FIXED_AMOUNT', amount: -50 }, 'amount must be greater than 0'],
    ['missing amount', { type: 'FIXED_AMOUNT' }, 'amount must be a number'],
    ['percentage over 100', { type: 'PERCENTAGE', percentage: 150 }, 'percentage must be greater than 0 and at most 100'],
    ['percentage as string', { type: 'PERCENTAGE', percentage: '10' }, 'percentage must be a number'],
    ['bad category', { type: 'CATEGORY_PERCENTAGE', category: 'Food', percentage: 10 }, 'category must be one of'],
    ['fractional points', { type: 'POINTS', points: 1.5 }, 'points must be a whole number'],
    ['negative points', { type: 'POINTS', points: -5 }, 'points must not be negative'],
    ['zero step', { type: 'SEASONAL', every: 0, discount: 40 }, 'every must be greater than 0'],
    ['missing seasonal discount', { type: 'SEASONAL', every: 300 }, 'discount must be a number'],
  ])('rejects %s', (_, raw, expected) => {
    expect(issuesOf([validItem], [raw]).join('\n')).toContain(expected)
  })

  it('reports every problem at once', () => {
    const issues = issuesOf(
      [{ ...validItem, price: -1 }, { ...validItem, category: 'Food' }],
      [{ type: 'PERCENTAGE', percentage: 0 }, { type: 'NOPE' }],
    )
    expect(issues).toHaveLength(4)
  })

  it('keeps only the known parameters', () => {
    const { campaigns } = parseDiscountInput([], [{ type: 'POINTS', points: 10, extra: true }])
    expect(campaigns).toEqual([{ type: 'POINTS', points: 10 }])
  })
})
