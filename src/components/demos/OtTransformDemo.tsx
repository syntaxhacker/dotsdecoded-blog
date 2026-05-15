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

const INITIAL = 'Hello World'

type Step = 'initial' | 'concurrent' | 'naive' | 'transform' | 'resolved'

const STEPS: Step[] = ['initial', 'concurrent', 'naive', 'transform', 'resolved']

const LABELS: Record<Step, string> = {
  initial: 'Initial',
  concurrent: 'Concurrent Ops',
  naive: 'Without OT',
  transform: 'Transform Step',
  resolved: 'With OT',
}

interface SubStepDesc {
  label: string
  render: () => React.ReactNode
}

function Doc({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: s.mono, fontSize: 20, background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 8, padding: '12px 16px', color: s.text, letterSpacing: 1.5,
    }}>
      {text.split('').map((ch, i) => (
        <span key={i} style={ch === ' ' ? { color: s.text3 } : undefined}>{ch === ' ' ? '\u00B7' : ch}</span>
      ))}
    </div>
  )
}

function OpLine({ user, char, pos, color, tag }: { user: string; char: string; pos: number; color: string; tag?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontFamily: s.mono, fontSize: 13, color: s.text }}>
      <span style={{ color, fontWeight: 600 }}>{user}</span>
      <span style={{ color: s.text2 }}>insert</span>
      <span style={{ color: s.yellow }}>"{char}"</span>
      <span style={{ color: s.text2 }}>at</span>
      <span style={{ color: s.accent }}>pos {pos}</span>
      {tag && <span style={{ color: s.green, fontSize: 10, background: `${s.green}18`, padding: '2px 6px', borderRadius: 4 }}>{tag}</span>}
    </div>
  )
}

function Callout({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: `${color}12`, border: `1px solid ${color}35`, borderRadius: 8,
      padding: '10px 14px', color, fontSize: 13, lineHeight: 1.5,
    }}>
      {children}
    </div>
  )
}

export default function OtTransformDemo() {
  const [step, setStep] = useState<Step>('initial')
  const [subIdx, setSubIdx] = useState(0)

  const getSubSteps = (): SubStepDesc[] => {
    switch (step) {
      case 'initial': return [{ label: 'Begin', render: () => (
        <div>
          <Doc text={INITIAL} />
          <div style={{ marginTop: 16, display: 'flex', gap: 20 }}>
            <div style={{ flex: 1, background: s.bg2, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
              <div style={{ color: s.red, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>User A (Alice)</div>
              <div style={{ color: s.text2, fontSize: 12 }}>Will insert "a" at position 0</div>
            </div>
            <div style={{ flex: 1, background: s.bg2, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
              <div style={{ color: s.accent, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>User B (Bob)</div>
              <div style={{ color: s.text2, fontSize: 12 }}>Will insert "b" at position 0</div>
            </div>
          </div>
        </div>
      )}]
      case 'concurrent': return [{ label: 'Both type', render: () => (
        <div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
            <div style={{ flex: 1, background: s.bg2, borderRadius: 8, padding: 12, border: `1px solid ${s.red}40` }}>
              <OpLine user="A" char="a" pos={0} color={s.red} />
            </div>
            <div style={{ flex: 1, background: s.bg2, borderRadius: 8, padding: 12, border: `1px solid ${s.accent}40` }}>
              <OpLine user="B" char="b" pos={0} color={s.accent} />
            </div>
          </div>
          <Callout color={s.yellow}>
            Conflict! Both users inserted at position 0. The server receives two operations that both target the same spot. Without coordination, one change will overwrite the other.
          </Callout>
        </div>
      )}]
      case 'naive': return [
        { label: 'Server applies A first', render: () => (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Server receives A's op</div>
              <OpLine user="A" char="a" pos={0} color={s.red} />
              <Doc text="aHello World" />
            </div>
            <div>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Server then applies B's raw op</div>
              <OpLine user="B" char="b" pos={0} color={s.accent} />
              <Doc text="bHello World" />
            </div>
            <Callout color={s.red}>
              User A's "a" is overwritten! The server applied B's operation at the original position 0 without adjusting for A's insertion. The result is "bHello World" -- A's character is gone.
            </Callout>
          </div>
        )},
        { label: 'Or: B first, then A', render: () => (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>If B arrives first</div>
              <OpLine user="B" char="b" pos={0} color={s.accent} />
              <Doc text="bHello World" />
            </div>
            <div>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Then A's raw op applied</div>
              <OpLine user="A" char="a" pos={0} color={s.red} />
              <Doc text="aHello World" />
            </div>
            <Callout color={s.red}>
              Now User B's "b" is overwritten. The outcome depends entirely on network timing -- whoever arrives last wins. This is called last-writer-wins and it causes data loss in collaborative editing.
            </Callout>
          </div>
        )},
      ]
      case 'transform': return [
        { label: 'Transform function', render: () => (
          <div>
            <div style={{ background: s.bg2, borderRadius: 8, padding: 14, border: `1px solid ${s.border}`, marginBottom: 16 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>OT Transform Function</div>
              <div style={{ color: s.text, fontFamily: s.mono, fontSize: 14, lineHeight: 1.6 }}>
                {`transform(insert("b", 0), insert("a", 0))`}
              </div>
            </div>
            <Callout color={s.accent}>
              The transform function takes two concurrent operations and adjusts their positions so they can be applied in sequence without conflict.
            </Callout>
          </div>
        )},
        { label: 'Position shift', render: () => (
          <div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Rule: concurrent insert at same position</div>
            <div style={{ background: s.bg2, borderRadius: 8, padding: 14, border: `1px solid ${s.border}`, fontFamily: s.mono, fontSize: 13, color: s.text, lineHeight: 1.6, marginBottom: 16 }}>
              {`if pos_a == pos_b:
  // lower site ID keeps position, higher shifts
  if siteID_a < siteID_b:
    opB.pos += 1
  else:
    opA.pos += 1`}
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ flex: 1, background: s.bg2, borderRadius: 8, padding: 12, textAlign: 'center', border: `1px solid ${s.border}` }}>
                <div style={{ color: s.text3, fontSize: 11, marginBottom: 2 }}>User B's original</div>
                <div style={{ color: s.text, fontFamily: s.mono, fontSize: 18 }}>pos 0</div>
              </div>
              <div style={{ color: s.text3, fontSize: 20 }}>{'\u2192'}</div>
              <div style={{ flex: 1, background: `${s.green}08`, borderRadius: 8, padding: 12, textAlign: 'center', border: `1px solid ${s.green}` }}>
                <div style={{ color: s.text3, fontSize: 11, marginBottom: 2 }}>After transform</div>
                <div style={{ color: s.green, fontFamily: s.mono, fontSize: 18 }}>pos 1</div>
              </div>
            </div>
            <Callout color={s.green}>
              User B's insertion position shifts from 0 to 1, making room for User A's "a". The site ID tiebreaker ensures deterministic ordering -- every client computes the same transformed position.
            </Callout>
          </div>
        )},
        { label: 'Is commutative', render: () => (
          <div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Key Property: Commutativity</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, background: s.bg2, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
                <div style={{ color: s.text, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>A then B</div>
                <div style={{ color: s.text2, fontFamily: s.mono, fontSize: 12 }}>
                  A: insert a pos 0{'<br/>'}
                  B: insert b pos 1{'<br/>'}
                  Result: "abHello World"
                </div>
              </div>
              <div style={{ flex: 1, background: s.bg2, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
                <div style={{ color: s.text, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>B then A</div>
                <div style={{ color: s.text2, fontFamily: s.mono, fontSize: 12 }}>
                  B: insert b pos 0{'<br/>'}
                  A: insert a pos 1{'<br/>'}
                  Result: "baHello World"
                </div>
              </div>
            </div>
            <Callout color={s.purple}>
              The results differ! "ab" vs "ba" -- the order depends on site priority. This is intentional: OT guarantees convergence (same state on all clients), but the final character order respects the tie-breaking rule. In practice, Google Docs uses a more sophisticated ordering scheme.
            </Callout>
          </div>
        )},
      ]
      case 'resolved': return [
        { label: 'Apply A then transformed B', render: () => (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Step 1: Apply User A's operation</div>
              <OpLine user="A" char="a" pos={0} color={s.red} />
              <Doc text="aHello World" />
            </div>
            <div>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Step 2: Apply transformed User B operation</div>
              <OpLine user="B" char="b" pos={1} color={s.accent} tag="transformed" />
              <Doc text="abHello World" />
            </div>
            <Callout color={s.green}>
              Both changes preserved! The transform function shifted B's insertion from position 0 to position 1, allowing both characters to coexist. The result "abHello World" is consistent across all clients.
            </Callout>
          </div>
        )},
        { label: 'Convergence verified', render: () => (
          <div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>All clients converge to the same state</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: s.bg2, borderRadius: 8, padding: 12, textAlign: 'center', border: `1px solid ${s.red}40` }}>
                <div style={{ color: s.red, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Client A sees</div>
                <Doc text="abHello World" />
              </div>
              <div style={{ flex: 1, background: s.bg2, borderRadius: 8, padding: 12, textAlign: 'center', border: `1px solid ${s.accent}40` }}>
                <div style={{ color: s.accent, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Client B sees</div>
                <Doc text="abHello World" />
              </div>
              <div style={{ flex: 1, background: s.bg2, borderRadius: 8, padding: 12, textAlign: 'center', border: `1px solid ${s.green}40` }}>
                <div style={{ color: s.green, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Server state</div>
                <Doc text="abHello World" />
              </div>
            </div>
            <Callout color={s.green}>
              This is convergence. Every participant sees "abHello World" regardless of network delays or operation ordering. The OT transform function makes this possible by adjusting concurrent operations before applying them.
            </Callout>
          </div>
        )},
      ]
    }
  }

  const subSteps = getSubSteps()
  const isLastStep = step === 'resolved' && subIdx === subSteps.length - 1
  const canNext = !isLastStep

  const next = () => {
    if (subIdx < subSteps.length - 1) {
      setSubIdx(i => i + 1)
    } else {
      const idx = STEPS.indexOf(step)
      if (idx < STEPS.length - 1) {
        setStep(STEPS[idx + 1])
        setSubIdx(0)
      }
    }
  }

  const reset = () => {
    setStep('initial')
    setSubIdx(0)
  }

  return (
    <DemoBoundary name="Operational Transformation">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>Operational Transformation</div>
      <div style={{ color: s.text3, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
        Two users type at the same position. Watch how OT resolves the conflict.
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {STEPS.map((st, i) => {
          const activeIdx = STEPS.indexOf(step)
          const isActive = i <= activeIdx
          const isCur = st === step
          return (
            <div key={st} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11,
              background: isActive ? (isCur ? `${s.accent}20` : `${s.accent}10`) : s.bg2,
              color: isCur ? s.accent : (isActive ? s.text2 : s.text3),
              border: `1px solid ${isCur ? s.accent : 'transparent'}`,
              fontWeight: isCur ? 600 : 400,
              transition: 'all 0.2s',
            }}>
              {i + 1}. {LABELS[st]}
            </div>
          )
        })}
      </div>

      <div style={{ marginBottom: 20, minHeight: 280 }}>
        {subSteps[subIdx]?.render()}
      </div>

      <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
        <button onClick={reset} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
          color: s.text2, cursor: 'pointer', fontSize: 13, transition: 'background 0.15s',
        }}>Reset</button>
        {canNext && (
          <button onClick={next} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            transition: 'opacity 0.15s',
          }}>
            {subIdx < subSteps.length - 1 ? 'Next Detail' : 'Next Phase'}
          </button>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
