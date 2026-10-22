import { vouchersByGroup } from '../data'
import {
  CAMPAIGN_GROUPS,
  CAMPAIGN_TYPES,
  campaignRegistry,
  type Campaign,
  type CampaignGroup,
  type CampaignType,
} from '../domain'
import { customOfferId, type OfferId } from '../hooks/useDiscountCalculator'
import { CampaignFields } from './CampaignFields'

export interface VoucherPickerProps {
  drafts: Record<CampaignType, Campaign>
  selection: Record<CampaignGroup, OfferId | null>
  onSelect: (group: CampaignGroup, id: OfferId | null) => void
  onDraftChange: (campaign: Campaign) => void
}

const GROUP_INFO: Record<CampaignGroup, { title: string; icon: string }> = {
  Coupon: { title: 'Coupon', icon: '🎟️' },
  OnTop: { title: 'On Top', icon: '⭐' },
  Seasonal: { title: 'Seasonal', icon: '🎉' },
}

const CUSTOM_LABELS: Record<CampaignType, string> = {
  FIXED_AMOUNT: 'Enter amount (฿)',
  PERCENTAGE: 'Enter percentage (%)',
  CATEGORY_PERCENTAGE: 'Category deal (pick category and %)',
  POINTS: 'Use my points (1 point = ฿1, max 20%)',
  SEASONAL: 'Custom seasonal (every X, get Y off)',
}

const NONE = ''

/** One dropdown per campaign group, so the "one per group" rule is enforced by the UI */
export function VoucherPicker({ drafts, selection, onSelect, onDraftChange }: VoucherPickerProps) {
  return (
    <div className="voucher-picker">
      {CAMPAIGN_GROUPS.map((group) => {
        const selected = selection[group]
        const customTypes = CAMPAIGN_TYPES.filter((type) => campaignRegistry[type].group === group)
        const selectedCustom = customTypes.find((type) => customOfferId(type) === selected)
        const { title, icon } = GROUP_INFO[group]

        return (
          <div key={group} className="voucher-row">
            <label className="voucher-select">
              <span>
                {icon} {title}
              </span>
              <select
                value={selected ?? NONE}
                onChange={(e) => onSelect(group, e.target.value === NONE ? null : e.target.value)}
              >
                <option value={NONE}>No {title.toLowerCase()}</option>
                <optgroup label="Available vouchers">
                  {vouchersByGroup(group).map((voucher) => (
                    <option key={voucher.id} value={voucher.id}>
                      {voucher.title} · {voucher.description}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Custom">
                  {customTypes.map((type) => (
                    <option key={type} value={customOfferId(type)}>
                      {CUSTOM_LABELS[type]}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
            {selectedCustom && (
              <div className="fields">
                <CampaignFields campaign={drafts[selectedCustom]} onChange={onDraftChange} />
              </div>
            )}
          </div>
        )
      })}
      <p className="hint">One per group, applied in order: Coupon → On Top → Seasonal.</p>
    </div>
  )
}
