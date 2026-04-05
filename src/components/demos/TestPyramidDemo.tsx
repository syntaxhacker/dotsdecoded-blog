import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const layers = [
  {
    id: 'system',
    label: 'System Tests',
    color: s.purple,
    width: 240,
    count: 'Few',
    speed: 'Slowest (seconds)',
    scope: 'Full stack',
    description: 'System tests exercise your entire application through a real browser. They simulate real user behavior: clicking buttons, filling forms, navigating pages. They catch integration bugs that unit tests miss but are expensive to run.',
    example: `# system/tests/users_test.rb
require "application_system_test_case"

class UsersTest < ApplicationSystemTestCase
  test "user signs up successfully" do
    visit new_user_registration_path
    fill_in "Email", with: "user@example.com"
    fill_in "Password", with: "secure123"
    click_button "Sign Up"
    assert_text "Welcome! You have signed up."
  end
end`,
    when: 'Use when you need to verify end-to-end flows: sign-up, checkout, multi-step wizards. Keep the count low because they are slow and brittle.',
  },
  {
    id: 'integration',
    label: 'Integration Tests',
    color: s.accent,
    width: 340,
    count: 'Moderate',
    speed: 'Moderate (milliseconds)',
    scope: 'Request/Response',
    description: 'Integration tests verify that multiple parts of your application work together correctly. They exercise controllers, models, and the routing layer as a unit, but skip the browser. They are faster than system tests and catch cross-component bugs.',
    example: `# test/integration/user_flows_test.rb
require "test_helper"

class UserFlowsTest < ActionDispatch::IntegrationTest
  test "create user and receive confirmation" do
    post "/users", params: {
      user: { email: "new@example.com", password: "secret" }
    }
    assert_response :created
    json = JSON.parse(response.body)
    assert_equal "new@example.com", json["email"]
    assert json["confirmation_url"].present?
  end
end`,
    when: 'Use when you need to test how controllers, models, and routes interact. API endpoints, authentication flows, and multi-model operations are good candidates.',
  },
  {
    id: 'unit',
    label: 'Unit Tests',
    color: s.green,
    width: 460,
    count: 'Many',
    speed: 'Fast (microseconds)',
    scope: 'Single class/method',
    description: 'Unit tests verify individual pieces of your code in isolation. They test one method, one class, or one small behavior at a time. Because they are fast and focused, you can run thousands of them in seconds. They form the foundation of your test suite.',
    example: `# test/models/user_test.rb
require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "valid user with email and password" do
    user = User.new(email: "test@example.com", password: "secret")
    assert user.valid?
  end

  test "invalid without email" do
    user = User.new(password: "secret")
    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test "email normalization" do
    user = User.new(email: "  TEST@Example.COM  ")
    user.valid?
    assert_equal "test@example.com", user.email
  end
end`,
    when: 'Use for every model method, validation, callback, service class, and utility function. If it has logic, it deserves a unit test. Aim for high coverage here.',
  },
]

export default function TestPyramidDemo() {
  const [selected, setSelected] = useState<string | null>(null)

  const selectedLayer = layers.find((l) => l.id === selected)

  const exampleHtml = useMemo(() => {
    if (!selectedLayer) return ''
    return Prism.highlight(selectedLayer.example, Prism.languages.ruby, 'ruby')
  }, [selectedLayer])

  return (
    <DemoBoundary name="Test Pyramid">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{ color: s.text3, fontSize: 13, fontFamily: s.mono }}>Click a layer to explore</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {layers.map((layer) => {
            const isActive = selected === layer.id
            return (
              <button
                key={layer.id}
                onClick={() => setSelected(isActive ? null : layer.id)}
                style={{
                  width: layer.width,
                  height: 72,
                  background: isActive ? layer.color : 'transparent',
                  border: `2px solid ${layer.color}`,
                  borderBottom: layer.id === 'unit' ? `2px solid ${layer.color}` : 'none',
                  borderRadius: layer.id === 'system' ? '10px 10px 0 0' : layer.id === 'unit' ? '0 0 10px 10px' : 0,
                  color: isActive ? s.bg : layer.color,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  fontFamily: s.mono,
                  fontSize: 14,
                  fontWeight: 600,
                  position: 'relative',
                }}
              >
                <span>{layer.label}</span>
                <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7 }}>{layer.count} | {layer.speed}</span>
              </button>
            )
          })}
        </div>

        {selectedLayer && (
          <div style={{ marginTop: 20, background: s.bg2, border: `1px solid ${selectedLayer.color}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${s.border}` }}>
              <div style={{ color: selectedLayer.color, fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{selectedLayer.label}</div>
              <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>{selectedLayer.description}</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ background: s.bg, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontFamily: s.mono, color: s.text2 }}>
                  Count: {selectedLayer.count}
                </div>
                <div style={{ background: s.bg, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontFamily: s.mono, color: s.text2 }}>
                  Speed: {selectedLayer.speed}
                </div>
                <div style={{ background: s.bg, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontFamily: s.mono, color: s.text2 }}>
                  Scope: {selectedLayer.scope}
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${s.border}` }}>
              <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Example</div>
              <div className="tpc" style={{ background: s.bg, borderRadius: 8, padding: 14, border: `1px solid ${s.border}`, overflowX: 'auto' }}>
                <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 12, lineHeight: 1.6 }}>
                  <style>{`
.tpc code .token.keyword { color: #f92672; }
.tpc code .token.string, .tpc code .token.char, .tpc code .token.builtin, .tpc code .token.inserted { color: #e6db74; }
.tpc code .token.number, .tpc code .token.constant, .tpc code .token.symbol, .tpc code .token.property, .tpc code .token.tag, .tpc code .token.boolean, .tpc code .token.deleted { color: #ae81ff; }
.tpc code .token.selector, .tpc code .token.attr-name { color: #f92672; }
.tpc code .token.attr-value, .tpc code .token.atrule { color: #e6db74; }
.tpc code .token.function, .tpc code .token.class-name { color: #a6e22e; }
.tpc code .token.operator, .tpc code .token.entity, .tpc code .token.url, .tpc code .token.punctuation { color: #f8f8f2; }
.tpc code .token.comment, .tpc code .token.prolog, .tpc code .token.doctype, .tpc code .token.cdata { color: #75715e; font-style: italic; }
.tpc code .token.parameter, .tpc code .token.variable, .tpc code .token.regex, .tpc code .token.important { color: #fd971f; }
`}</style>
                  <code dangerouslySetInnerHTML={{ __html: exampleHtml }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 20px' }}>
              <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>When to use</div>
              <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.5 }}>{selectedLayer.when}</div>
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
