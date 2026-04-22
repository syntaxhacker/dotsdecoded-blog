import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-bash'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface GemInfo {
  name: string
  desc: string
  install: string
  usage: string
  popularity: number
}

const categories: Record<string, { label: string; color: string; gems: GemInfo[] }> = {
  auth: {
    label: 'Authentication',
    color: s.accent,
    gems: [
      {
        name: 'Devise',
        desc: 'Full-stack authentication solution with models, controllers, and views out of the box. Handles registration, login, logout, password recovery, sessions, and remember-me tokens.',
        install: "gem 'devise'\nrails generate devise:install\nrails generate devise User\nrails db:migrate",
        usage: "class ApplicationController < ActionController::Base\n  before_action :authenticate_user!\nend",
        popularity: 95,
      },
      {
        name: 'OmniAuth',
        desc: 'Rack-based middleware for multi-provider OAuth. Supports Google, GitHub, Twitter, Facebook, and 100+ other providers with a unified interface.',
        install: "gem 'omniauth'\ngem 'omniauth-github'\ngem 'omniauth-google-oauth2'",
        usage: "Rails.application.config.middleware.use OmniAuth::Builder do\n  provider :github, ENV['GITHUB_KEY'], ENV['GITHUB_SECRET']\n  provider :google_oauth2, ENV['GOOGLE_KEY'], ENV['GOOGLE_SECRET']\nend",
        popularity: 88,
      },
    ],
  },
  authorization: {
    label: 'Authorization',
    color: s.purple,
    gems: [
      {
        name: 'Pundit',
        desc: 'Minimal authorization library using plain Ruby classes. Each policy maps to a model. Clean, testable, and easy to reason about.',
        install: "gem 'pundit'\n# In ApplicationController:\ninclude Pundit::Authorization",
        usage: "class PostPolicy < ApplicationPolicy\n  def update?\n    user.admin? || record.user == user\n  end\n\n  def destroy?\n    user.admin?\n  end\nend",
        popularity: 82,
      },
      {
        name: 'CanCanCan',
        desc: 'Ability-based authorization using a single Ability class. Define rules once, check permissions anywhere with `can?` and `cannot?`.',
        install: "gem 'cancancan'\nrails generate cancan:ability",
        usage: "class Ability\n  include CanCan::Ability\n\n  def initialize(user)\n    can :read, Post, public: true\n    can :manage, Post, user_id: user.id\n    can :manage, :all if user.admin?\n  end\nend",
        popularity: 72,
      },
    ],
  },
  jobs: {
    label: 'Background Jobs',
    color: s.orange,
    gems: [
      {
        name: 'Sidekiq',
        desc: 'High-performance background job processor backed by Redis. Handles millions of jobs per day. Includes a web dashboard for monitoring.',
        install: "gem 'sidekiq'\ngem 'redis'\n# In config/application.rb:\nconfig.active_job.queue_adapter = :sidekiq",
        usage: "class ProcessVideoWorker\n  include Sidekiq::Job\n\n  def perform(video_id)\n    video = Video.find(video_id)\n    video.transcode!\n    video.notify_user!\n  end\nend\n\nProcessVideoWorker.perform_async(video.id)",
        popularity: 94,
      },
    ],
  },
  search: {
    label: 'Search & Pagination',
    color: s.green,
    gems: [
      {
        name: 'Ransack',
        desc: 'Search and filtering for ActiveRecord. Builds complex queries from simple parameters. Perfect for admin dashboards and filter forms.',
        install: "gem 'ransack'",
        usage: "# In controller:\n@q = Post.ransack(params[:q])\n@posts = @q.result(distinct: true)\n\n# In view:\n= search_form_for @q do |f|\n  = f.search_field :title_cont\n  = f.submit 'Search'",
        popularity: 78,
      },
      {
        name: 'Pagy',
        desc: 'Fast, lightweight pagination. Uses less memory than Kaminari or WillPaginate. The recommended pagination gem for Rails 7+.',
        install: "gem 'pagy'",
        usage: "# In controller:\n@pagy, @posts = pagy(Post.all)\n\n# In view:\n<%= pagy_nav(@pagy) %>",
        popularity: 76,
      },
      {
        name: 'Kaminari',
        desc: 'Battle-tested pagination library with themeable views and helpers. Works seamlessly with ActiveRecord and Array objects.',
        install: "gem 'kaminari'\nrails g kaminari:views default",
        usage: "# In controller:\n@posts = Post.page(params[:page]).per(25)\n\n# In view:\n<%= paginate @posts %>",
        popularity: 70,
      },
    ],
  },
  uploads: {
    label: 'File Uploads',
    color: s.yellow,
    gems: [
      {
        name: 'Active Storage',
        desc: 'Built into Rails since 5.2. Upload files to cloud storage (S3, GCS, Azure) or local disk. Handles variants, previews, and metadata.',
        install: "# No gem needed - built into Rails\nrails active_storage:install\nrails db:migrate",
        usage: "class User < ApplicationRecord\n  has_one_attached :avatar\n  has_many_attached :documents\nend\n\n# In controller:\nuser.avatar.attach(params[:avatar])\nuser.avatar.variant(resize_to_limit: [300, 300])",
        popularity: 90,
      },
      {
        name: 'Shrine',
        desc: 'Modern file attachment toolkit with pluggable storage backends and processing. Supports direct uploads to S3, background processing, and metadata extraction.',
        install: "gem 'shrine'\ngem 'image_processing'",
        usage: "class User < ApplicationRecord\n  include Shrine::Attachment(:avatar)\nend\n\n# Uploader handles storage, processing, versions\n# Supports direct S3 uploads from the browser",
        popularity: 62,
      },
    ],
  },
  api: {
    label: 'API & Serialization',
    color: s.red,
    gems: [
      {
        name: 'jbuilder',
        desc: 'Built into Rails (as jbuilder). Build JSON views with Ruby DSL. Clean, readable templates that produce JSON responses.',
        install: "# Included with Rails by default\n# No additional gem needed",
        usage: "json.extract! @post, :id, :title, :body\njson.author do\n  json.name @post.user.name\n  json.avatar_url @post.user.avatar_url\nend\njson.comments @post.comments do |c|\n  json.extract! c, :id, :body, :created_at\nend",
        popularity: 85,
      },
    ],
  },
  testing: {
    label: 'Testing',
    color: '#56b6c2',
    gems: [
      {
        name: 'RSpec',
        desc: 'Behavior-driven testing framework for Ruby. Expressive syntax with `describe`, `it`, `expect`. The de facto standard for Rails testing.',
        install: "gem 'rspec-rails', group: [:development, :test]\nrails generate rspec:install",
        usage: "RSpec.describe Post, type: :model do\n  it 'requires a title' do\n    post = Post.new(title: nil)\n    expect(post).not_to be_valid\n    expect(post.errors[:title]).to include(\"can't be blank\")\n  end\n\n  it 'belongs to a user' do\n    assoc = described_class.reflect_on_association(:user)\n    expect(assoc.macro).to eq(:belongs_to)\n  end\nend",
        popularity: 92,
      },
      {
        name: 'Factory Bot',
        desc: 'Test fixture replacement. Define factories for your models instead of fixtures. Cleaner, more flexible, and easier to maintain.',
        install: "gem 'factory_bot_rails', group: [:development, :test]",
        usage: "FactoryBot.define do\n  factory :user do\n    name { 'John Doe' }\n    email { 'john@example.com' }\n    password { 'password123' }\n  end\nend\n\n# In tests:\nuser = create(:user)\nposts = create_list(:post, 3, user: user)",
        popularity: 88,
      },
      {
        name: 'Capybara',
        desc: 'Integration testing that simulates real user interactions in a browser. Click links, fill forms, assert on page content.',
        install: "gem 'capybara', group: :test\ngem 'selenium-webdriver', group: :test",
        usage: "RSpec.describe 'User login', type: :system do\n  it 'logs in with valid credentials' do\n    visit new_user_session_path\n    fill_in 'Email', with: user.email\n    fill_in 'Password', with: 'password'\n    click_button 'Log in'\n    expect(page).to have_text('Signed in successfully')\n  end\nend",
        popularity: 84,
      },
    ],
  },
  monitoring: {
    label: 'Monitoring',
    color: '#c678dd',
    gems: [
      {
        name: 'Sentry',
        desc: 'Real-time error tracking and performance monitoring. Captures exceptions, breadcrumbs, and performance data. Free tier available.',
        install: "gem 'sentry-rails'\ngem 'sentry-ruby'",
        usage: "# config/initializers/sentry.rb\nSentry.init do |config|\n  config.dsn = ENV['SENTRY_DSN']\n  config.breadcrumbs_logger = [:active_support_logger]\n  config.traces_sample_rate = 0.2\nend",
        popularity: 86,
      },
    ],
  },
}

const catKeys = Object.keys(categories)

export default function GemExplorerDemo() {
  const [activeCat, setActiveCat] = useState<string>(catKeys[0])
  const [selectedGem, setSelectedGem] = useState<GemInfo | null>(null)

  const cat = categories[activeCat]

  const barWidth = useMemo(() => {
    return (g: GemInfo) => `${Math.max(g.popularity, 5)}%`
  }, [])

  const installHtml = useMemo(() => {
    if (!selectedGem) return ''
    return Prism.highlight(selectedGem.install, Prism.languages.bash, 'bash')
  }, [selectedGem])

  const usageHtml = useMemo(() => {
    if (!selectedGem) return ''
    return Prism.highlight(selectedGem.usage, Prism.languages.ruby, 'ruby')
  }, [selectedGem])

  return (
    <DemoBoundary name="Gem Explorer">
      <div className="gec" style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <style>{`
.gec code .token.keyword { color: #f92672; }
.gec code .token.string, .gec code .token.char, .gec code .token.builtin, .gec code .token.inserted { color: #e6db74; }
.gec code .token.number, .gec code .token.constant, .gec code .token.symbol, .gec code .token.property, .gec code .token.tag, .gec code .token.boolean, .gec code .token.deleted { color: #ae81ff; }
.gec code .token.selector, .gec code .token.attr-name { color: #f92672; }
.gec code .token.attr-value, .gec code .token.atrule { color: #e6db74; }
.gec code .token.function, .gec code .token.class-name { color: #a6e22e; }
.gec code .token.operator, .gec code .token.entity, .gec code .token.url, .gec code .token.punctuation { color: #f8f8f2; }
.gec code .token.comment, .gec code .token.prolog, .gec code .token.doctype, .gec code .token.cdata { color: #75715e; font-style: italic; }
.gec code .token.parameter, .gec code .token.variable, .gec code .token.regex, .gec code .token.important { color: #fd971f; }
        `}</style>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {catKeys.map((key) => {
            const c = categories[key]
            const active = key === activeCat
            return (
              <div
                key={key}
                onClick={() => { setActiveCat(key); setSelectedGem(null) }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: active ? c.color + '20' : s.bg2,
                  border: `1px solid ${active ? c.color + '60' : s.border}`,
                  color: active ? c.color : s.text3,
                }}
              >
                {c.label}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', minWidth: 260 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cat.gems.map((g) => {
                const selected = selectedGem?.name === g.name
                return (
                  <div
                    key={g.name}
                    onClick={() => setSelectedGem(g)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: selected ? cat.color + '15' : s.bg2,
                      border: `1px solid ${selected ? cat.color + '50' : s.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: selected ? cat.color : s.text, fontFamily: s.mono }}>
                        {g.name}
                      </span>
                      <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>
                        {g.popularity}%
                      </span>
                    </div>
                    <div style={{
                      height: 3, borderRadius: 2, background: s.bg3,
                      overflow: 'hidden', marginBottom: 4,
                    }}>
                      <div style={{
                        height: '100%', width: barWidth(g), borderRadius: 2,
                        background: cat.color,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ fontSize: 12, color: s.text3, lineHeight: 1.4 }}>
                      {g.desc.slice(0, 80)}...
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ flex: '1 1 400px', minWidth: 300 }}>
            {selectedGem ? (
              <div>
                <div style={{
                  fontSize: 18, fontWeight: 700, color: cat.color,
                  fontFamily: s.mono, marginBottom: 4,
                }}>
                  {selectedGem.name}
                </div>
                <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6, marginBottom: 16 }}>
                  {selectedGem.desc}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                    Installation
                  </div>
                  <div style={{
                    background: s.bg, borderRadius: 8, padding: 12,
                    border: `1px solid ${s.border}`,
                  }}>
                    <div style={{ fontFamily: s.mono, fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre' }}>
                      <code dangerouslySetInnerHTML={{ __html: installHtml }} />
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                    Usage
                  </div>
                  <div style={{
                    background: s.bg, borderRadius: 8, padding: 12,
                    border: `1px solid ${s.border}`,
                    maxHeight: 280, overflowY: 'auto',
                  }}>
                    <div style={{ fontFamily: s.mono, fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre' }}>
                      <code dangerouslySetInnerHTML={{ __html: usageHtml }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 11, color: s.text3 }}>Popularity:</div>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: s.bg3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${selectedGem.popularity}%`, borderRadius: 3,
                      background: cat.color, transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: cat.color, fontFamily: s.mono }}>
                    {selectedGem.popularity}%
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: 60, textAlign: 'center', color: s.text3, fontSize: 13,
                background: s.bg2, borderRadius: 8, border: `1px dashed ${s.border}`,
                height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                Select a gem to see details
              </div>
            )}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
