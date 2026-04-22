import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const skinnyController = `class OrdersController < ApplicationController
  def create
    order = current_user.orders.build(order_params)
    if order.process_payment
      redirect_to order, notice: 'Order placed!'
    else
      render :new, status: :unprocessable_content
    end
  end

  private

  def order_params
    params.require(:order).permit(:item_id, :quantity)
  end
end`

const fatController = `class OrdersController < ApplicationController
  def create
    @order = current_user.orders.build(
      item_id: params[:order][:item_id],
      quantity: params[:order][:quantity]
    )

    if @order.quantity <= 0
      flash[:error] = "Quantity must be positive"
      render :new, status: :unprocessable_content
      return
    end

    item = Item.find(@order.item_id)
    if item.stock < @order.quantity
      flash[:error] = "Not enough stock"
      render :new, status: :unprocessable_content
      return
    end

    subtotal = item.price * @order.quantity
    tax = subtotal * 0.08
    total = subtotal + tax

    @order.subtotal = subtotal
    @order.tax = tax
    @order.total = total

    if current_user.wallet_balance >= total
      current_user.update!(
        wallet_balance: current_user.wallet_balance - total
      )
      item.update!(stock: item.stock - @order.quantity)
      @order.status = 'paid'
      @order.save!

      OrderMailer.confirmation(@order).deliver_later
      redirect_to @order, notice: 'Order placed!'
    else
      flash[:error] = "Insufficient balance"
      render :new, status: :unprocessable_content
    end
  end
end`

const modelCode = `class Order < ApplicationRecord
  belongs_to :user
  belongs_to :item

  validates :quantity, presence: true,
            numericality: { greater_than: 0 }

  def process_payment
    return false unless valid?
    return false unless item.enough_stock?(quantity)
    return false unless user.can_afford?(total)

    ActiveRecord::Base.transaction do
      user.deduct!(total)
      item.decrement!(:stock, quantity)
      update!(status: 'paid')
    end

    OrderMailer.confirmation(self).deliver_later
    true
  rescue => e
    errors.add(:base, e.message)
    false
  end
end`

function CodeBlock({ code, label, color }: { code: string; label: string; color: string }) {
  const html = useMemo(() => Prism.highlight(code, Prism.languages.ruby, 'ruby'), [code])
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', background: color,
        }} />
        <span style={{ color: color, fontSize: 13, fontWeight: 600, fontFamily: s.mono }}>{label}</span>
      </div>
      <style>{`
        .fmc code .token.keyword { color: #f92672; }
        .fmc code .token.string, .fmc code .token.char, .fmc code .token.builtin, .fmc code .token.inserted { color: #e6db74; }
        .fmc code .token.number, .fmc code .token.constant, .fmc code .token.symbol, .fmc code .token.property, .fmc code .token.tag, .fmc code .token.boolean, .fmc code .token.deleted { color: #ae81ff; }
        .fmc code .token.selector, .fmc code .token.attr-name { color: #f92672; }
        .fmc code .token.attr-value, .fmc code .token.atrule { color: #e6db74; }
        .fmc code .token.function, .fmc code .token.class-name { color: #a6e22e; }
        .fmc code .token.operator, .fmc code .token.entity, .fmc code .token.url, .fmc code .token.punctuation { color: #f8f8f2; }
        .fmc code .token.comment, .fmc code .token.prolog, .fmc code .token.doctype, .fmc code .token.cdata { color: #75715e; font-style: italic; }
        .fmc code .token.parameter, .fmc code .token.variable, .fmc code .token.regex, .fmc code .token.important { color: #fd971f; }
      `}</style>
      <div className="fmc" style={{
        background: s.bg, border: `1px solid ${s.border}`,
        borderRadius: 10, padding: '16px 18px',
        fontFamily: s.mono, fontSize: 12, lineHeight: 1.65,
        whiteSpace: 'pre', overflow: 'auto',
      }}>
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}

export default function FatModelDemo() {
  const [view, setView] = useState<'compare' | 'model'>('compare')

  return (
    <DemoBoundary name="Fat Model, Skinny Controller">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
      }}>
        {[
          { key: 'compare' as const, label: 'Controller Comparison' },
          { key: 'model' as const, label: 'Model Logic' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key)} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            border: `1px solid ${view === tab.key ? s.accent : s.border}`,
            background: view === tab.key ? `${s.accent}22` : s.bg2,
            color: view === tab.key ? s.accent : s.text3,
            fontFamily: s.mono, transition: 'all 0.2s ease',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'compare' && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <CodeBlock code={skinnyController} label="Skinny Controller" color={s.green} />
          <CodeBlock code={fatController} label="Fat Controller" color={s.red} />
        </div>
      )}

      {view === 'model' && (
        <CodeBlock code={modelCode} label="Order Model" color={s.purple} />
      )}

      <div style={{
        marginTop: 16, padding: '14px 18px', background: s.bg2,
        borderRadius: 10, border: `1px solid ${s.border}`,
      }}>
        <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6 }}>
          <span style={{ color: s.green, fontWeight: 600, fontFamily: s.mono }}>Skinny Controller:</span>{' '}
          Handles routing, params, and redirects. Business logic lives in the model.
        </div>
        <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6, marginTop: 6 }}>
          <span style={{ color: s.red, fontWeight: 600, fontFamily: s.mono }}>Fat Controller:</span>{' '}
          Hard to test, impossible to reuse. Payment logic is locked inside a controller action.
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
