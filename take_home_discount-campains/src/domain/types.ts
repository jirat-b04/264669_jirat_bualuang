export const ITEM_CATEGORIES = ['Clothing', 'Accessories', 'Electronics'] as const
export type ItemCategory = (typeof ITEM_CATEGORIES)[number]

export interface CartItem {
  id: string
  name: string
  category: ItemCategory
  /** Unit price in THB */
  price: number
  quantity: number
}

/**
 * Campaign groups. Only one campaign per group may be applied,
 * and groups are applied in the order they appear in this list.
 */
export const CAMPAIGN_GROUPS = ['Coupon', 'OnTop', 'Seasonal'] as const
export type CampaignGroup = (typeof CAMPAIGN_GROUPS)[number]

export interface FixedAmountCampaign {
  type: 'FIXED_AMOUNT'
  amount: number
}

export interface PercentageCampaign {
  type: 'PERCENTAGE'
  percentage: number
}

export interface CategoryPercentageCampaign {
  type: 'CATEGORY_PERCENTAGE'
  category: ItemCategory
  percentage: number
}

export interface PointsCampaign {
  type: 'POINTS'
  points: number
}

export interface SeasonalCampaign {
  type: 'SEASONAL'
  every: number
  discount: number
}

export type Campaign =
  | FixedAmountCampaign
  | PercentageCampaign
  | CategoryPercentageCampaign
  | PointsCampaign
  | SeasonalCampaign

export type CampaignType = Campaign['type']

export interface DiscountStep {
  campaign: Campaign
  group: CampaignGroup
  label: string
  priceBefore: number
  discount: number
  priceAfter: number
  note?: string
}

export interface DiscountResult {
  subtotal: number
  totalDiscount: number
  finalPrice: number
  steps: DiscountStep[]
}
