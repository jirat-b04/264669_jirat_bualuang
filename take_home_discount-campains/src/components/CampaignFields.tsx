import { ITEM_CATEGORIES, POINTS_CAP_PERCENTAGE, type Campaign, type ItemCategory } from '../domain'

interface Props {
  campaign: Campaign
  onChange: (campaign: Campaign) => void
}

/** Empty input becomes NaN so the engine reports it instead of silently using 0 */
const toNumber = (value: string) => (value.trim() === '' ? Number.NaN : Number(value))

function NumberField({ label, value, onChange, suffix }: {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="input-wrap">
        <input
          type="number"
          inputMode="decimal"
          value={Number.isNaN(value) ? '' : value}
          onChange={(e) => onChange(toNumber(e.target.value))}
        />
        {suffix && <span className="suffix">{suffix}</span>}
      </span>
    </label>
  )
}

export function CampaignFields({ campaign, onChange }: Props) {
  switch (campaign.type) {
    case 'FIXED_AMOUNT':
      return <NumberField label="Amount" suffix="฿" value={campaign.amount} onChange={(amount) => onChange({ ...campaign, amount })} />
    case 'PERCENTAGE':
      return <NumberField label="Percentage" suffix="%" value={campaign.percentage} onChange={(percentage) => onChange({ ...campaign, percentage })} />
    case 'CATEGORY_PERCENTAGE':
      return (
        <>
          <label className="field">
            <span>Category</span>
            <select
              value={campaign.category}
              onChange={(e) => onChange({ ...campaign, category: e.target.value as ItemCategory })}
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <NumberField label="Percentage" suffix="%" value={campaign.percentage} onChange={(percentage) => onChange({ ...campaign, percentage })} />
        </>
      )
    case 'POINTS':
      return (
        <>
          <NumberField label="Customer points" suffix="pts" value={campaign.points} onChange={(points) => onChange({ ...campaign, points })} />
          <p className="hint">1 point = ฿1, capped at {POINTS_CAP_PERCENTAGE}% of the price.</p>
        </>
      )
    case 'SEASONAL':
      return (
        <>
          <NumberField label="Every" suffix="฿" value={campaign.every} onChange={(every) => onChange({ ...campaign, every })} />
          <NumberField label="Discount" suffix="฿" value={campaign.discount} onChange={(discount) => onChange({ ...campaign, discount })} />
        </>
      )
  }
}
