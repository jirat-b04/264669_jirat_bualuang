import { useState } from 'react'
import type { Product } from '../data'
import { formatThb, ITEM_CATEGORIES, type ItemCategory } from '../domain'

interface Props {
  products: Product[]
  search: string
  onAdd: (product: Product) => void
}

type Filter = ItemCategory | 'All'

export function ProductGrid({ products, search, onAdd }: Props) {
  const [filter, setFilter] = useState<Filter>('All')
  const query = search.trim().toLowerCase()
  const visible = products.filter(
    (p) => (filter === 'All' || p.category === filter) && p.name.toLowerCase().includes(query),
  )

  return (
    <section className="card">
      <div className="section-head">
        <h2>Products</h2>
        <div className="tabs" role="tablist">
          {(['All', ...ITEM_CATEGORIES] as Filter[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={filter === tab}
              className={filter === tab ? 'tab active' : 'tab'}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="empty">No products match “{search}”.</p>
      ) : (
        <div className="product-grid">
          {visible.map((product) => (
            <article key={product.id} className="product">
              <div className="product-image" aria-hidden="true">
                {product.image}
              </div>
              <div className="product-body">
                <span className="product-category">{product.category}</span>
                <h3>{product.name}</h3>
                <div className="product-footer">
                  <span className="price">{formatThb(product.price)}</span>
                  <button type="button" className="add" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}>
                    + Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
