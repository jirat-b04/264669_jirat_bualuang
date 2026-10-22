import { useState } from 'react'
import { formatThb } from '../domain'
import type { Calculation } from '../hooks/useDiscountCalculator'
import { VoucherPicker, type VoucherPickerProps } from './VoucherPicker'

interface Props {
  calculation: Calculation
  itemCount: number
  vouchers: VoucherPickerProps
}

function PriceBreakdown({ calculation, itemCount }: Omit<Props, 'vouchers'>) {
  const [placed, setPlaced] = useState<number | null>(null)

  if (!calculation.ok) {
    return (
      <>
        <div className="error" role="alert">
          <strong>Cannot calculate the price</strong>
          <ul>
            {calculation.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
        <button type="button" className="checkout" disabled>
          Place order
        </button>
      </>
    )
  }

  const { subtotal, steps, totalDiscount, finalPrice } = calculation.result
  return (
    <>
      <dl className="summary">
        <div className="line">
          <dt>Subtotal ({itemCount} items)</dt>
          <dd>{formatThb(subtotal)}</dd>
        </div>
        {steps.map((step) => (
          <div key={step.campaign.type} className="line discount">
            <dt>
              {step.label}
              {step.note && <small>{step.note}</small>}
            </dt>
            <dd>−{formatThb(step.discount)}</dd>
          </div>
        ))}
      </dl>
      <div className="total">
        <div>
          <span>Total</span>
          {totalDiscount > 0 && <small className="saved">You save {formatThb(totalDiscount)}</small>}
        </div>
        <strong>{formatThb(finalPrice)}</strong>
      </div>
      <button type="button" className="checkout" disabled={itemCount === 0} onClick={() => setPlaced(finalPrice)}>
        Place order
      </button>
      {placed === finalPrice && itemCount > 0 && (
        <p className="placed" role="status">
          ✅ Demo order placed for {formatThb(placed)}
        </p>
      )}
    </>
  )
}

export function OrderSummary({ calculation, itemCount, vouchers }: Props) {
  return (
    <section className="card summary-card">
      <h2>Order Summary</h2>
      <VoucherPicker {...vouchers} />
      <PriceBreakdown calculation={calculation} itemCount={itemCount} />
    </section>
  )
}
