import { describe, expect, it } from 'vitest'
import scenarios from './scenarios.json'
import { calculateDiscount } from '../calculateDiscount'
import { DiscountValidationError } from '../errors'
import type { CartItem } from '../types'

const item = (name: string, category: CartItem['category'], price: number, quantity = 1): CartItem => ({
  id: name.toLowerCase(),
  name,
  category,
  price,
  quantity,
})

const tshirt = item('T-Shirt', 'Clothing', 350)
const hoodie = item('Hoodie', 'Clothing', 700)
const hat = item('Hat', 'Accessories', 250)
const belt = item('Belt', 'Accessories', 230)
const watch = item('Watch', 'Accessories', 850)
const bag = item('Bag', 'Accessories', 640)

const issuesOf = (fn: () => unknown): string[] => {
  try {
    fn()
  } catch (error) {
    if (error instanceof DiscountValidationError) return error.issues
    throw error
  }
  throw new Error('Expected DiscountValidationError')
}

describe('examples from the assignment', () => {
  it.each(scenarios)('$title → $expectedFinalPrice THB', (scenario) => {
    expect(calculateDiscount(scenario.cart, scenario.campaigns).finalPrice).toBe(scenario.expectedFinalPrice)
  })
})

describe('without campaigns', () => {
  it('returns the subtotal, counting quantities', () => {
    const result = calculateDiscount([item('T-Shirt', 'Clothing', 350, 3)], [])
    expect(result).toEqual({ subtotal: 1050, totalDiscount: 0, finalPrice: 1050, steps: [] })
  })

  it('handles an empty cart', () => {
    const result = calculateDiscount([], [{ type: 'SEASONAL', every: 300, discount: 40 }])
    expect(result.finalPrice).toBe(0)
  })

  it('avoids floating point drift', () => {
    const result = calculateDiscount([item('A', 'Clothing', 0.1), item('B', 'Clothing', 0.2)], [])
    expect(result.finalPrice).toBe(0.3)
  })
})

describe('Coupon campaigns', () => {
  it('fixed amount never pushes the price below zero', () => {
    const result = calculateDiscount([hat], [{ type: 'FIXED_AMOUNT', amount: 1000 }])
    expect(result.finalPrice).toBe(0)
    expect(result.steps[0].discount).toBe(250)
  })

  it('100% percentage makes the cart free', () => {
    expect(calculateDiscount([tshirt, hat], [{ type: 'PERCENTAGE', percentage: 100 }]).finalPrice).toBe(0)
  })

  it('percentage keeps satang precision', () => {
    expect(calculateDiscount([item('A', 'Clothing', 99.99)], [{ type: 'PERCENTAGE', percentage: 15 }]).finalPrice).toBe(84.99)
  })
})

describe('On Top campaigns', () => {
  it('category discount gives 0 when no item matches', () => {
    const result = calculateDiscount([hat], [{ type: 'CATEGORY_PERCENTAGE', category: 'Electronics', percentage: 50 }])
    expect(result.finalPrice).toBe(250)
    expect(result.steps[0].note).toMatch(/No Electronics/)
  })

  it('category discount uses the category price after the coupon', () => {
    // Subtotal 1000 (Clothing 500), 10% coupon → 900, Clothing share → 450, 20% → 90
    const cart = [item('Shirt', 'Clothing', 500), item('Cap', 'Accessories', 500)]
    const result = calculateDiscount(cart, [
      { type: 'PERCENTAGE', percentage: 10 },
      { type: 'CATEGORY_PERCENTAGE', category: 'Clothing', percentage: 20 },
    ])
    expect(result.steps.map((s) => s.discount)).toEqual([100, 90])
    expect(result.finalPrice).toBe(810)
  })

  it('points are capped at 20% of the price', () => {
    const result = calculateDiscount([tshirt, hat, belt], [{ type: 'POINTS', points: 500 }])
    expect(result.steps[0].discount).toBe(166)
    expect(result.finalPrice).toBe(664)
    expect(result.steps[0].note).toMatch(/Capped/)
  })

  it('points cap is based on the price after the coupon', () => {
    // 1000 - 500 coupon = 500, cap 20% = 100
    const result = calculateDiscount([item('A', 'Clothing', 1000)], [
      { type: 'FIXED_AMOUNT', amount: 500 },
      { type: 'POINTS', points: 300 },
    ])
    expect(result.finalPrice).toBe(400)
  })

  it('zero points apply no discount', () => {
    expect(calculateDiscount([tshirt], [{ type: 'POINTS', points: 0 }]).finalPrice).toBe(350)
  })
})

describe('Seasonal campaigns', () => {
  it('applies nothing below the threshold', () => {
    expect(calculateDiscount([belt], [{ type: 'SEASONAL', every: 300, discount: 40 }]).finalPrice).toBe(230)
  })

  it('counts each full step', () => {
    expect(calculateDiscount([item('A', 'Clothing', 900)], [{ type: 'SEASONAL', every: 300, discount: 40 }]).finalPrice).toBe(780)
  })

  it('works on the price after earlier campaigns', () => {
    // 600 - 10% = 540 → one step of 300 → 500
    const result = calculateDiscount([tshirt, hat], [
      { type: 'PERCENTAGE', percentage: 10 },
      { type: 'SEASONAL', every: 300, discount: 40 },
    ])
    expect(result.finalPrice).toBe(500)
  })

  it('cannot discount more than the remaining price', () => {
    expect(calculateDiscount([item('A', 'Clothing', 100)], [{ type: 'SEASONAL', every: 10, discount: 50 }]).finalPrice).toBe(0)
  })
})

describe('applying multiple campaigns', () => {
  it('applies Coupon → On Top → Seasonal regardless of input order', () => {
    const campaigns = [
      { type: 'SEASONAL', every: 300, discount: 40 },
      { type: 'POINTS', points: 68 },
      { type: 'FIXED_AMOUNT', amount: 50 },
    ]
    const result = calculateDiscount([tshirt, hoodie, watch, bag], campaigns)
    expect(result.steps.map((s) => s.group)).toEqual(['Coupon', 'OnTop', 'Seasonal'])
    // 2540 - 50 = 2490 - 68 = 2422 - 8 × 40 = 2102
    expect(result.finalPrice).toBe(2102)
    expect(result.totalDiscount).toBe(438)
  })

  it('records the running price on every step', () => {
    const result = calculateDiscount([tshirt, hat], [
      { type: 'FIXED_AMOUNT', amount: 50 },
      { type: 'POINTS', points: 10 },
    ])
    expect(result.steps.map((s) => [s.priceBefore, s.discount, s.priceAfter])).toEqual([
      [600, 50, 550],
      [550, 10, 540],
    ])
  })

  it('rejects two campaigns from the same group', () => {
    const issues = issuesOf(() =>
      calculateDiscount([tshirt], [
        { type: 'FIXED_AMOUNT', amount: 50 },
        { type: 'PERCENTAGE', percentage: 10 },
      ]),
    )
    expect(issues).toEqual(['Only one Coupon campaign is allowed, got FIXED_AMOUNT and PERCENTAGE'])
  })

  it('rejects the same campaign twice', () => {
    expect(() =>
      calculateDiscount([tshirt], [
        { type: 'POINTS', points: 10 },
        { type: 'POINTS', points: 10 },
      ]),
    ).toThrow(DiscountValidationError)
  })

  it('does not mutate its input', () => {
    const cart = [{ ...tshirt }]
    const campaigns = [{ type: 'SEASONAL', every: 300, discount: 40 }, { type: 'PERCENTAGE', percentage: 10 }]
    const snapshot = structuredClone({ cart, campaigns })
    calculateDiscount(cart, campaigns)
    expect({ cart, campaigns }).toEqual(snapshot)
  })
})
