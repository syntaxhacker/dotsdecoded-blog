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

const patterns = [
  {
    name: 'Callback Hell',
    icon: '{ }',
    bad: `class User < ApplicationRecord
  before_create :set_defaults
  before_create :generate_token
  before_create :send_welcome_email
  before_create :create_profile
  after_create  :notify_admin
  after_create  :log_sign_up
  after_create  :enqueue_onboarding
  after_save    :update_cache
  after_save    :sync_to_crm
  after_save    :refresh_analytics
  after_commit  :trigger_webhook
  after_commit  :index_for_search
end`,
    why: 'Seven before/after/save/commit callbacks chained together. Impossible to debug. Hard to test in isolation. Order-dependent bugs lurk here.',
    good: `class CreateUserService
  def call(user_params)
    user = User.new(user_params)
    user.assign_defaults
    user.generate_token!

    ActiveRecord::Base.transaction do
      user.save!
      user.create_profile!
    end

    BackgroundJob.perform_later(:onboarding, user.id)
    SearchIndexer.index(user)
    AdminNotifier.sign_up(user)

    { success: true, user: user }
  rescue => e
    { success: false, error: e.message }
  end
end`,
  },
  {
    name: 'Query in View',
    icon: '<>',
    bad: `<h1>Dashboard</h1>

<% recent = Post.where(published: true)
                .order(created_at: :desc)
                .limit(10) %>

<% recent.each do |post| %>
  <div>
    <h2><%= post.title %></h2>
    <p><%= post.body.truncate(100) %></p>
    <% comments = post.comments
                      .where(approved: true) %>
    <span><%= comments.count %> comments</span>
  </div>
<% end %>`,
    why: 'N+1 query hiding in the view. For 10 posts, this fires 1 + 10 = 11 queries. As traffic grows, the database becomes the bottleneck.',
    good: `class DashboardController < ApplicationController
  def show
    @posts = Post.includes(:approved_comments)
                 .published
                 .recent(10)
  end
end

<% @posts.each do |post| %>
  <div>
    <h2><%= post.title %></h2>
    <p><%= post.body.truncate(100) %></p>
    <span>
      <%= post.approved_comments.size %> comments
    </span>
  </div>
<% end %>`,
  },
  {
    name: 'God Model',
    icon: 'M',
    bad: `class User < ApplicationRecord
  has_many :orders
  has_many :reviews
  has_many :payments

  def process_order(attrs)  end
  def calculate_revenue     end
  def generate_report       end
  def send_newsletter       end
  def sync_to_crm           end
  def export_data(format)   end
  def calculate_tax(zip)    end
  def apply_discount(code)  end
  def validate_address      end
  def calculate_shipping    end
  def process_refund(order) end
  def update_analytics      end
end

# 800 lines and growing...`,
    why: 'The User model knows about orders, revenue, tax, shipping, CRM sync, newsletters, analytics. Every new feature adds more methods. Changes in one area break others.',
    good: `app/
  models/user.rb            (50 lines)
  services/
    order_processor.rb
    revenue_calculator.rb
    report_generator.rb
    newsletter_sender.rb
    crm_sync_service.rb
    data_exporter.rb
    tax_calculator.rb
    discount_applier.rb
    shipping_calculator.rb
    refund_processor.rb
    analytics_updater.rb

# Each service: ~30 lines, 1 responsibility,
# independently testable.`,
  },
  {
    name: 'Nested If/Else',
    icon: '?',
    bad: `def create
  if params[:order]
    if current_user
      if params[:order][:items].present?
        items = params[:order][:items]
        if items.all? { |i| i[:qty].to_i > 0 }
          order = Order.new(order_params)
          if order.save
            if params[:promo_code]
              apply_promo(order, params[:promo_code])
            end
            redirect_to order
          else
            render :new
          end
        else
          flash[:error] = "Invalid quantities"
          render :new
        end
      else
        flash[:error] = "No items"
        render :new
      end
    else
      redirect_to login_path
    end
  end
end`,
    why: '7 levels of nesting. The actual business logic is buried under conditionals. Nearly impossible to follow the happy path.',
    good: `class OrdersController < ApplicationController
  before_action :authenticate_user!

  def create
    result = OrderCreator.call(
      user: current_user,
      items: params[:order][:items],
      promo_code: params[:promo_code]
    )

    if result.success?
      redirect_to result.order
    else
      flash[:error] = result.error
      render :new
    end
  end
end`,
  },
]

const badCodeHtml = patterns.map(p => Prism.highlight(p.bad, Prism.languages.ruby, 'ruby'))
const goodCodeHtml = patterns.map(p => Prism.highlight(p.good, Prism.languages.ruby, 'ruby'))

type Panel = 'gallery' | 'detail'

export default function AntiPatternDemo() {
  const [panel, setPanel] = useState<Panel>('gallery')
  const [selected, setSelected] = useState(0)
  const [codeTab, setCodeTab] = useState<'bad' | 'good'>('bad')

  const p = patterns[selected]

  return (
    <DemoBoundary name="Anti-Pattern Gallery">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      {panel === 'gallery' && (
        <>
          <div style={{
            fontSize: 14, fontWeight: 600, color: s.text,
            marginBottom: 16,
          }}>
            Click an anti-pattern to inspect it:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {patterns.map((pt, i) => (
              <div key={i} onClick={() => { setSelected(i); setPanel('detail'); setCodeTab('bad') }} style={{
                padding: '16px', borderRadius: 10, cursor: 'pointer',
                background: s.bg2, border: `1px solid ${s.border}`,
                transition: 'all 0.2s ease',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${s.red}18`, border: `1px solid ${s.red}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: s.mono, fontSize: 14, color: s.red,
                  fontWeight: 700, marginBottom: 10,
                }}>
                  {pt.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 4 }}>
                  {pt.name}
                </div>
                <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.5 }}>
                  {pt.why.split('.')[0]}.
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {panel === 'detail' && (
        <>
          <button onClick={() => setPanel('gallery')} style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            border: `1px solid ${s.border}`, background: s.bg2,
            color: s.text3, fontFamily: s.mono, marginBottom: 16,
          }}>
            {'<'} Back to Gallery
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: `${s.red}18`, border: `1px solid ${s.red}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: s.mono, fontSize: 16, color: s.red, fontWeight: 700,
            }}>
              {p.icon}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.text }}>{p.name}</div>
              <div style={{ fontSize: 12, color: s.text3, marginTop: 2 }}>Anti-Pattern</div>
            </div>
          </div>

          <div style={{
            padding: '12px 16px', background: `${s.yellow}10`,
            border: `1px solid ${s.yellow}30`, borderRadius: 8,
            marginBottom: 16, fontSize: 13, color: s.text2, lineHeight: 1.6,
          }}>
            <span style={{ color: s.yellow, fontWeight: 600, fontFamily: s.mono }}>Why it's bad:</span>{' '}
            {p.why}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button onClick={() => setCodeTab('bad')} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${codeTab === 'bad' ? s.red : s.border}`,
              background: codeTab === 'bad' ? `${s.red}18` : s.bg2,
              color: codeTab === 'bad' ? s.red : s.text3,
              fontFamily: s.mono, fontWeight: 600, transition: 'all 0.2s ease',
            }}>
              Bad Code
            </button>
            <button onClick={() => setCodeTab('good')} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${codeTab === 'good' ? s.green : s.border}`,
              background: codeTab === 'good' ? `${s.green}18` : s.bg2,
              color: codeTab === 'good' ? s.green : s.text3,
              fontFamily: s.mono, fontWeight: 600, transition: 'all 0.2s ease',
            }}>
              Refactored
            </button>
          </div>

          <div className="apc" style={{
            background: s.bg2, border: `1px solid ${codeTab === 'bad' ? s.red : s.green}30`,
            borderRadius: 10, padding: '14px 16px',
            fontFamily: s.mono, fontSize: 11.5, lineHeight: 1.6,
            whiteSpace: 'pre', overflow: 'auto',
            maxHeight: 360,
          }}>
            <style>{`
.apc code .token.keyword { color: #f92672; }
.apc code .token.string, .apc code .token.char, .apc code .token.builtin, .apc code .token.inserted { color: #e6db74; }
.apc code .token.number, .apc code .token.constant, .apc code .token.symbol, .apc code .token.property, .apc code .token.tag, .apc code .token.boolean, .apc code .token.deleted { color: #ae81ff; }
.apc code .token.selector, .apc code .token.attr-name { color: #f92672; }
.apc code .token.attr-value, .apc code .token.atrule { color: #e6db74; }
.apc code .token.function, .apc code .token.class-name { color: #a6e22e; }
.apc code .token.operator, .apc code .token.entity, .apc code .token.url, .apc code .token.punctuation { color: #f8f8f2; }
.apc code .token.comment, .apc code .token.prolog, .apc code .token.doctype, .apc code .token.cdata { color: #75715e; font-style: italic; }
.apc code .token.parameter, .apc code .token.variable, .apc code .token.regex, .apc code .token.important { color: #fd971f; }
`}</style>
            <code dangerouslySetInnerHTML={{ __html: codeTab === 'bad' ? badCodeHtml[selected] : goodCodeHtml[selected] }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {patterns.map((_, i) => (
              <button key={i} onClick={() => { setSelected(i); setCodeTab('bad') }} style={{
                width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                border: 'none', background: i === selected ? s.accent : s.border,
                transition: 'all 0.2s ease', padding: 0,
              }} />
            ))}
          </div>
        </>
      )}
    </div>
    </DemoBoundary>
  )
}
