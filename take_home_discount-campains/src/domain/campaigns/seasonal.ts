import type { SeasonalCampaign } from '../types'
import { formatThb, toSatang } from '../money'
import { checkPositiveAmount } from './checks'
import type { CampaignDefinition } from './definition'

export const seasonal: CampaignDefinition<SeasonalCampaign> = {
  type: 'SEASONAL',
  group: 'Seasonal',
  title: 'Special campaign',
  describe: (c) => `${formatThb(c.discount)} off every ${formatThb(c.every)}`,
  validate: (c) => [
    ...checkPositiveAmount(c.every, 'every'),
    ...checkPositiveAmount(c.discount, 'discount'),
  ],
  apply: (c, { current }) => {
    const times = Math.floor(current / toSatang(c.every))
    return {
      discount: times * toSatang(c.discount),
      note: `${times} × ${formatThb(c.every)} reached`,
    }
  },
}
