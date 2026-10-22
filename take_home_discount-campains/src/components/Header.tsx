interface Props {
  search: string
  onSearch: (value: string) => void
  cartCount: number
}

export function Header({ search, onSearch, cartCount }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="#">
          <span className="brand-mark">P</span> PlayMart
        </a>
        <input
          className="search"
          type="search"
          placeholder="Search products"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <a className="cart-link" href="#cart" aria-label={`Cart, ${cartCount} items`}>
          🛒
          {cartCount > 0 && <span className="badge">{cartCount > 99 ? '99+' : cartCount}</span>}
        </a>
      </div>
    </header>
  )
}
