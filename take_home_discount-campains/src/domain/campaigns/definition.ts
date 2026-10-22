import type { CartItem, CampaignGroup, Campaign, CampaignType } from '../types'

export interface PricingContext {
  items: CartItem[]
  /** Cart subtotal before any campaign, in satang */
  subtotal: number
  /** Running price after previously applied campaigns, in satang */
  current: number
}

export interface DiscountOutcome {
  /** Discount in satang; the engine clamps it to [0, current] */
  discount: number
  note?: string
}

export interface CampaignDefinition<T extends Campaign = Campaign> {
  type: T['type']
  group: CampaignGroup
  title: string
  describe: (campaign: T) => string
  /** Returns a list of problems with the campaign's parameters (empty when valid) */
  validate: (campaign: Record<string, unknown>) => string[]
  apply: (campaign: T, context: PricingContext) => DiscountOutcome
}

export type CampaignRegistry = {
  [K in CampaignType]: CampaignDefinition<Extract<Campaign, { type: K }>>
}
