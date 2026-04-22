import { useState } from 'react'
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

const beforeCode = `class User < ApplicationRecord
  has_many :orders
  has_secure_password

  def process_order(item, quantity, payment_method)
    return { success: false, error: 'Invalid quantity' } if quantity <= 0

    item = Item.find_by(id: item)
    return { success: false, error: 'Item not found' } unless item

    if item.stock < quantity
      return { success: false, error: 'Out of stock' }
    end

    subtotal = item.price * quantity
    tax = subtotal * 0.08
    total = subtotal + tax

    case payment_method
    when 'wallet'
      if wallet_balance < total
        return { success: false, error: 'Insufficient funds' }
      end
      deduct_wallet!(total)
    when 'credit_card'
      charge = StripeCharge.call(total, stripe_customer_id)
      unless charge.success?
        return { success: false, error: charge.error }
      end
    else
      return { success: false, error: 'Invalid method' }
    end

    order = orders.create!(
      item: item, quantity: quantity,
      subtotal: subtotal, tax: tax, total: total
    )
    item.decrement!(:stock, quantity)
    OrderMailer.confirmation(order).deliver_later
    NotificationService.notify(self, "Order placed!")

    { success: true, order: order }
  end
end`

const serviceCode = `class OrderProcessor
  def initialize(user, item, quantity, payment_method)
    @user = user
    @item = Item.find_by(id: item)
    @quantity = quantity
    @payment_method = payment_method
  end

  def call
    validate_inputs!
    calculate_totals
    process_payment
    create_order
    notify_user
    { success: true, order: @order }
  rescue StandardError => e
    { success: false, error: e.message }
  end

  private

  def validate_inputs!
    raise 'Invalid quantity' if @quantity <= 0
    raise 'Item not found' unless @item
    raise 'Out of stock' if @item.stock < @quantity
  end

  def calculate_totals
    @subtotal = @item.price * @quantity
    @tax = @subtotal * 0.08
    @total = @subtotal + @tax
  end

  def process_payment
    PaymentHandler.process(
      method: @payment_method,
      amount: @total,
      user: @user
    )
  end

  def create_order
    @order = @user.orders.create!(
      item: @item, quantity: @quantity,
      subtotal: @subtotal, tax: @tax, total: @total
    )
    @item.decrement!(:stock, @quantity)
  end

  def notify_user
    OrderMailer.confirmation(@order).deliver_later
  end
end`

const usageCode = `class OrdersController < ApplicationController
  def create
    result = OrderProcessor.call(
      current_user,
      params[:item_id],
      params[:quantity],
      params[:payment_method]
    )

    if result[:success]
      redirect_to result[:order],
                  notice: 'Order placed!'
    else
      flash[:error] = result[:error]
      redirect_back fallback_location: items_path
    end
  end
end`

const testCode = `RSpec.describe OrderProcessor do
  it 'processes a successful order' do
    user = create(:user, wallet_balance: 100)
    item = create(:item, price: 10, stock: 5)

    result = described_class.call(user, item.id, 2, 'wallet')

    expect(result[:success]).to be true
    expect(result[:order].total).to eq(21.6)
    expect(item.reload.stock).to eq(3)
  end

  it 'rejects out-of-stock orders' do
    user = create(:user)
    item = create(:item, stock: 1)

    result = described_class.call(user, item.id, 5, 'wallet')

    expect(result[:success]).to be false
    expect(result[:error]).to match(/Out of stock/)
  end
end`

const codeHtmlMap: Record<string, string> = {
  model: Prism.highlight(beforeCode, Prism.languages.ruby, 'ruby'),
  service: Prism.highlight(serviceCode, Prism.languages.ruby, 'ruby'),
  usage: Prism.highlight(usageCode, Prism.languages.ruby, 'ruby'),
  test: Prism.highlight(testCode, Prism.languages.ruby, 'ruby'),
}

type Step = 'model' | 'service' | 'usage' | 'test'

const steps: { key: Step; label: string; color: string }[] = [
  { key: 'model', label: '1. Bloated Model', color: s.red },
  { key: 'service', label: '2. Service Object', color: s.green },
  { key: 'usage', label: '3. Controller Usage', color: s.accent },
  { key: 'test', label: '4. Unit Test', color: s.purple },
]

const codeMap: Record<Step, string> = {
  model: beforeCode,
  service: serviceCode,
  usage: usageCode,
  test: testCode,
}

const descMap: Record<Step, string> = {
  model: 'This model method does too much: validation, payment processing, order creation, notifications. It cannot be tested in isolation.',
  service: 'The service object has a single .call method. Each step is a private method. Easy to read, easy to test, easy to modify.',
  usage: 'The controller becomes trivially simple. It delegates to the service and handles the response.',
  test: 'Service objects are pure Ruby classes. Unit test them without Rails, without database, without HTTP requests.',
}

export default function ServiceObjectDemo() {
  const [active, setActive] = useState<Step>('model')

  return (
    <DemoBoundary name="Service Object Extraction">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {steps.map(st => (
          <button key={st.key} onClick={() => setActive(st.key)} style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            border: `1px solid ${active === st.key ? st.color : s.border}`,
            background: active === st.key ? `${st.color}18` : s.bg2,
            color: active === st.key ? st.color : s.text3,
            fontFamily: s.mono, transition: 'all 0.2s ease', fontWeight: 600,
          }}>
            {st.label}
          </button>
        ))}
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 16px', borderBottom: `1px solid ${s.border}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: steps.find(st => st.key === active)?.color,
          }} />
          <span style={{
            fontSize: 12, fontFamily: s.mono,
            color: steps.find(st => st.key === active)?.color,
          }}>
            {active === 'model' && 'app/models/user.rb'}
            {active === 'service' && 'app/services/order_processor.rb'}
            {active === 'usage' && 'app/controllers/orders_controller.rb'}
            {active === 'test' && 'spec/services/order_processor_spec.rb'}
          </span>
        </div>
        <div className="soc" style={{
          padding: '16px 18px', fontFamily: s.mono, fontSize: 11.5,
          lineHeight: 1.65, whiteSpace: 'pre', overflow: 'auto',
          maxHeight: 420,
        }}>
          <style>{`
.soc code .token.keyword { color: #f92672; }
.soc code .token.string, .soc code .token.char, .soc code .token.builtin, .soc code .token.inserted { color: #e6db74; }
.soc code .token.number, .soc code .token.constant, .soc code .token.symbol, .soc code .token.property, .soc code .token.tag, .soc code .token.boolean, .soc code .token.deleted { color: #ae81ff; }
.soc code .token.selector, .soc code .token.attr-name { color: #f92672; }
.soc code .token.attr-value, .soc code .token.atrule { color: #e6db74; }
.soc code .token.function, .soc code .token.class-name { color: #a6e22e; }
.soc code .token.operator, .soc code .token.entity, .soc code .token.url, .soc code .token.punctuation { color: #f8f8f2; }
.soc code .token.comment, .soc code .token.prolog, .soc code .token.doctype, .soc code .token.cdata { color: #75715e; font-style: italic; }
.soc code .token.parameter, .soc code .token.variable, .soc code .token.regex, .soc code .token.important { color: #fd971f; }
`}</style>
          <code dangerouslySetInnerHTML={{ __html: codeHtmlMap[active] }} />
        </div>
      </div>

      <div style={{
        marginTop: 14, padding: '12px 16px', background: s.bg2,
        borderRadius: 8, border: `1px solid ${s.border}`,
        fontSize: 13, color: s.text2, lineHeight: 1.6,
      }}>
        {descMap[active]}
      </div>
    </div>
    </DemoBoundary>
  )
}
