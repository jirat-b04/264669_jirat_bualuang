import { formatThb } from '../domain'
import type { CartLine } from '../hooks/useDiscountCalculator'

interface Props {
  cart: CartLine[]
  onQuantityChange: (id: string, quantity: number) => void
}

export function CartList({ cart, onQuantityChange }: Props) {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <section className="card" id="cart">
      <div className="section-head">
        <h2>
          Shopping Cart <span className="muted">({count} items)</span>
        </h2>
      </div>

      {cart.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🛒</div>
          Your cart is empty. Add products above to start.
        </div>
      ) : (
        <ul className="cart-list">
          {cart.map((item) => (
            <li key={item.id} className="cart-row">
              <div className="thumb" aria-hidden="true">
                {item.image}
              </div>
              <div className="cart-info">
                <strong>{item.name}</strong>
                <span className="product-category">{item.category}</span>
                <span className="muted">{formatThb(item.price)}</span>
              </div>
              <div className="stepper">
                <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => onQuantityChange(item.id, item.quantity - 1)}>
                  −
                </button>
                <span>{item.quantity}</span>
                <button type="button" aria-label={`Add one ${item.name}`} onClick={() => onQuantityChange(item.id, item.quantity + 1)}>
                  +
                </button>
              </div>
              <div className="line-total">{formatThb(item.price * item.quantity)}</div>
              <button type="button" className="remove" aria-label={`Remove ${item.name}`} onClick={() => onQuantityChange(item.id, 0)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
