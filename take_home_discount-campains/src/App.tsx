import { useState } from 'react'
import './App.css'
import { CartList } from './components/CartList'
import { Header } from './components/Header'
import { OrderSummary } from './components/OrderSummary'
import { ProductGrid } from './components/ProductGrid'
import { products } from './data'
import { useDiscountCalculator } from './hooks/useDiscountCalculator'

function App() {
  const calculator = useDiscountCalculator()
  const [search, setSearch] = useState('')
  const itemCount = calculator.cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      <Header search={search} onSearch={setSearch} cartCount={itemCount} />

      <main className="page">
        <div className="main-column">
          <ProductGrid products={products} search={search} onAdd={calculator.addProduct} />
          <CartList cart={calculator.cart} onQuantityChange={calculator.setQuantity} />
        </div>

        <aside className="checkout-column">
          <OrderSummary
            calculation={calculator.calculation}
            itemCount={itemCount}
            vouchers={{
              drafts: calculator.drafts,
              selection: calculator.selection,
              onSelect: calculator.selectOffer,
              onDraftChange: calculator.updateDraft,
            }}
          />
        </aside>
      </main>
    </>
  )
}

export default App
