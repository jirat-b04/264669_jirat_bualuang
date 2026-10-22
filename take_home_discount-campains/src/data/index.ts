import { campaignRegistry, type Campaign, type CampaignGroup, type CampaignType, type CartItem } from '../domain'
import campaignDefaultsJson from './campaignDefaults.json'
import productsJson from './products.json'
import vouchersJson from './vouchers.json'

export type Product = Omit<CartItem, 'quantity'> & { image: string }

export interface Voucher {
  id: string
  title: string
  description: string
  campaign: Campaign
}

// Mock data stands in for an API. It is still validated by the engine
// at calculation time, so a bad edit here surfaces as a visible error.
export const products = productsJson as Product[]
export const vouchers = vouchersJson as Voucher[]
export const campaignDefaults = campaignDefaultsJson as { [K in CampaignType]: Extract<Campaign, { type: K }> }

export const vouchersByGroup = (group: CampaignGroup) =>
  vouchers.filter((voucher) => campaignRegistry[voucher.campaign.type].group === group)
