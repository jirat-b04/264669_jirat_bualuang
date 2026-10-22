import type { Campaign, CampaignType } from '../types'
import { categoryPercentage } from './categoryPercentage'
import type { CampaignDefinition, CampaignRegistry } from './definition'
import { fixedAmount } from './fixedAmount'
import { percentage } from './percentage'
import { points } from './points'
import { seasonal } from './seasonal'

export const campaignRegistry: CampaignRegistry = {
  FIXED_AMOUNT: fixedAmount,
  PERCENTAGE: percentage,
  CATEGORY_PERCENTAGE: categoryPercentage,
  POINTS: points,
  SEASONAL: seasonal,
}

export const CAMPAIGN_TYPES = Object.keys(campaignRegistry) as CampaignType[]

export const isCampaignType = (value: unknown): value is CampaignType =>
  typeof value === 'string' && Object.hasOwn(campaignRegistry, value)

export const getDefinition = <T extends Campaign>(campaign: T) =>
  campaignRegistry[campaign.type] as unknown as CampaignDefinition<T>

export { POINTS_CAP_PERCENTAGE } from './points'
export type { CampaignDefinition, PricingContext } from './definition'
