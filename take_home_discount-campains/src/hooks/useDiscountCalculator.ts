import { useMemo, useState } from 'react'
import { campaignDefaults, vouchers, type Product } from '../data'
import {
  CAMPAIGN_GROUPS,
  calculateDiscount,
  DiscountValidationError,
  type Campaign,
  type CampaignGroup,
  type CampaignType,
  type CartItem,
  type DiscountResult,
} from '../domain'

export type CartLine = CartItem & { image: string }
type Drafts = { [K in CampaignType]: Extract<Campaign, { type: K }> }

/**
 * A selected offer is either a preset voucher id or `custom:<TYPE>`,
 * where the parameters come from the editable drafts.
 */
export type OfferId = string
type Selection = Record<CampaignGroup, OfferId | null>

const CUSTOM_PREFIX = 'custom:'
export const customOfferId = (type: CampaignType): OfferId => `${CUSTOM_PREFIX}${type}`

const emptySelection: Selection = { Coupon: null, OnTop: null, Seasonal: null }

export type Calculation = { ok: true; result: DiscountResult } | { ok: false; issues: string[] }

export function useDiscountCalculator() {
  const [cart, setCart] = useState<CartLine[]>([])
  const [drafts, setDrafts] = useState<Drafts>(campaignDefaults)
  const [selection, setSelection] = useState<Selection>(emptySelection)

  const campaigns = useMemo(
    () =>
      CAMPAIGN_GROUPS.flatMap((group) => {
        const id = selection[group]
        if (!id) return []
        if (id.startsWith(CUSTOM_PREFIX)) return [drafts[id.slice(CUSTOM_PREFIX.length) as CampaignType]]
        const voucher = vouchers.find((v) => v.id === id)
        return voucher ? [voucher.campaign] : []
      }),
    [drafts, selection],
  )

  const calculation = useMemo<Calculation>(() => {
    try {
      return { ok: true, result: calculateDiscount(cart, campaigns) }
    } catch (error) {
      if (error instanceof DiscountValidationError) return { ok: false, issues: error.issues }
      throw error
    }
  }, [cart, campaigns])

  const addProduct = (product: Product) =>
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id)
      if (existing) {
        return items.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...items, { ...product, quantity: 1 }]
    })

  const setQuantity = (id: string, quantity: number) =>
    setCart((items) =>
      quantity <= 0
        ? items.filter((item) => item.id !== id)
        : items.map((item) => (item.id === id ? { ...item, quantity } : item)),
    )

  const selectOffer = (group: CampaignGroup, id: OfferId | null) =>
    setSelection((current) => ({ ...current, [group]: id }))

  const updateDraft = (campaign: Campaign) =>
    setDrafts((current) => ({ ...current, [campaign.type]: campaign }))

  return {
    cart,
    campaigns,
    drafts,
    selection,
    calculation,
    addProduct,
    setQuantity,
    selectOffer,
    updateDraft,
  }
}
