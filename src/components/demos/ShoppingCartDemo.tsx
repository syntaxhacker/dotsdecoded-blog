import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Product = {
  id: number
  name: string
  price: number
  category: string
}

type CartItem = {
  product: Product
  qty: number
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'Wireless Headphones', price: 79.99, category: 'Electronics' },
  { id: 2, name: 'USB-C Cable (3-pack)', price: 12.99, category: 'Accessories' },
  { id: 3, name: 'Mechanical Keyboard', price: 129.99, category: 'Electronics' },
  { id: 4, name: 'Laptop Stand', price: 39.99, category: 'Office' },
  { id: 5, name: 'Webcam HD 1080p', price: 59.99, category: 'Electronics' },
  { id: 6, name: 'Desk Mat XL', price: 24.99, category: 'Office' },
]

const TAX_RATE = 0.0875
const SHIPPING_THRESHOLD = 50
const SHIPPING_COST = 5.99

export default function ShoppingCartDemo() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [discountCode, setDiscountCode] = useState('')
  const [discountMsg, setDiscountMsg] = useState('')
  const [discount, setDiscount] = useState(0)

  const addItem = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, { product, qty: 1 }]
    })
  }

  const updateQty = (id: number, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.product.id !== id) return item
        const newQty = item.qty + delta
        if (newQty <= 0) return item
        return { ...item, qty: newQty }
      }).filter((item) => item.qty > 0)
    })
  }

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== id))
  }

  const applyDiscount = () => {
    const code = discountCode.trim().toUpperCase()
    if (code === 'SAVE10') {
      setDiscount(0.1)
      setDiscountMsg('10% discount applied')
    } else if (code === 'SAVE20') {
      setDiscount(0.2)
      setDiscountMsg('20% discount applied')
    } else if (code === '') {
      setDiscount(0)
      setDiscountMsg('')
    } else {
      setDiscountMsg('Invalid code')
      setDiscount(0)
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0)
  const discountAmt = subtotal * discount
  const afterDiscount = subtotal - discountAmt
  const tax = afterDiscount * TAX_RATE
  const shipping = cart.length > 0 && afterDiscount < SHIPPING_THRESHOLD ? SHIPPING_COST : 0
  const total = afterDiscount + tax + shipping

  const storageLabel = cart.length > 0 ? 'Redis (session cart)' : 'No cart data'

  return (
    <DemoBoundary name="Shopping Cart">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 10 }}>Products</div>
            {PRODUCTS.map((p) => {
              const inCart = cart.find((item) => item.product.id === p.id)
              return (
                <div key={p.id} style={{
                  background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
                  padding: '10px 14px', marginBottom: 8, display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: s.text3, marginTop: 2 }}>{p.category}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, fontFamily: s.mono, color: s.green }}>
                      ${p.price.toFixed(2)}
                    </span>
                    {inCart && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => updateQty(p.id, -1)}
                          style={{
                            width: 24, height: 24, borderRadius: 4, border: `1px solid ${s.border}`,
                            background: s.bg3, color: s.text, fontSize: 14, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: s.mono, padding: 0,
                          }}
                        >-</button>
                        <span style={{ fontSize: 13, fontFamily: s.mono, color: s.text, width: 20, textAlign: 'center' }}>
                          {inCart.qty}
                        </span>
                        <button onClick={() => updateQty(p.id, 1)}
                          style={{
                            width: 24, height: 24, borderRadius: 4, border: `1px solid ${s.border}`,
                            background: s.bg3, color: s.text, fontSize: 14, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: s.mono, padding: 0,
                          }}
                        >+</button>
                      </div>
                    )}
                    <button onClick={() => addItem(p)}
                      style={{
                        padding: '5px 12px', borderRadius: 5, border: 'none',
                        background: inCart ? s.bg3 : s.accent, color: inCart ? s.text3 : '#fff',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      }}
                    >
                      {inCart ? 'In Cart' : 'Add'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div>
            <div style={{
              background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10,
              padding: 16, position: 'sticky', top: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: s.text }}>
                  Cart ({cart.reduce((sum, item) => sum + item.qty, 0)} items)
                </div>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, background: s.bg, padding: '2px 8px', borderRadius: 4 }}>
                  {storageLabel}
                </span>
              </div>

              {cart.length === 0 && (
                <div style={{ fontSize: 13, color: s.text3, textAlign: 'center', padding: '20px 0' }}>
                  Cart is empty
                </div>
              )}

              {cart.map((item) => (
                <div key={item.product.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0', borderBottom: `1px solid ${s.bg3}`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: s.text2 }}>{item.product.name}</div>
                    <div style={{ fontSize: 11, color: s.text3 }}>Qty: {item.qty}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontFamily: s.mono, color: s.text }}>
                      ${(item.product.price * item.qty).toFixed(2)}
                    </span>
                    <button onClick={() => removeItem(item.product.id)}
                      style={{
                        width: 20, height: 20, borderRadius: 4, border: 'none',
                        background: 'transparent', color: s.red, fontSize: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                      }}
                    >x</button>
                  </div>
                </div>
              ))}

              {cart.length > 0 && (
                <>
                  <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
                    <input
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Discount code"
                      style={{
                        flex: 1, padding: '6px 10px', borderRadius: 5, border: `1px solid ${s.border}`,
                        background: s.bg, color: s.text, fontSize: 12, fontFamily: s.mono, outline: 'none',
                      }}
                    />
                    <button onClick={applyDiscount}
                      style={{
                        padding: '6px 12px', borderRadius: 5, border: 'none',
                        background: s.bg3, color: s.text2, fontSize: 12, cursor: 'pointer',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      }}
                    >Apply</button>
                  </div>
                  {discountMsg && (
                    <div style={{ fontSize: 11, color: discount > 0 ? s.green : s.red, marginTop: 4 }}>
                      {discountMsg}
                    </div>
                  )}

                  <div style={{ marginTop: 12, borderTop: `1px solid ${s.border}`, paddingTop: 10 }}>
                    {[
                      { label: 'Subtotal', value: subtotal.toFixed(2) },
                      ...(discount > 0 ? [{ label: `Discount (${(discount * 100).toFixed(0)}%)`, value: `-${discountAmt.toFixed(2)}`, color: s.green }] : []),
                      { label: 'Tax (8.75%)', value: tax.toFixed(2) },
                      { label: 'Shipping', value: shipping > 0 ? shipping.toFixed(2) : 'FREE', color: shipping > 0 ? s.text : s.green },
                    ].map((row) => (
                      <div key={row.label} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '3px 0',
                      }}>
                        <span style={{ fontSize: 12, color: s.text3 }}>{row.label}</span>
                        <span style={{ fontSize: 12, fontFamily: s.mono, color: (row as any).color || s.text2 }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', padding: '8px 0 0',
                      borderTop: `1px solid ${s.border}`, marginTop: 6,
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: s.text }}>Total</span>
                      <span style={{ fontSize: 16, fontWeight: 700, fontFamily: s.mono, color: s.green }}>
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {shipping > 0 && (
                    <div style={{ fontSize: 11, color: s.text3, marginTop: 6 }}>
                      Free shipping on orders over $50.00
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
