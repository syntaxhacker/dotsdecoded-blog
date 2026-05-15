import { useState, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Entry {
  id: number
  account: string
  debit: number
  credit: number
  description: string
}

const initialAccounts = {
  A: { name: 'Merchant Account', balance: 5000 },
  B: { name: 'Customer Account', balance: 3000 },
  C: { name: 'Platform Escrow', balance: 0 },
}

export default function DoubleEntryLedgerDemo() {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [entries, setEntries] = useState<Entry[]>([
    { id: 0, account: 'Merchant Account', debit: 0, credit: 5000, description: 'Initial balance' },
    { id: 1, account: 'Customer Account', debit: 0, credit: 3000, description: 'Initial balance' },
  ])
  const [amount, setAmount] = useState('')
  const [from, setFrom] = useState('A')
  const [to, setTo] = useState('B')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const nextId = useRef(2)
  const listRef = useRef<HTMLDivElement>(null)

  const [transferType, setTransferType] = useState<'payment' | 'refund' | 'escrow'>('payment')

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0)
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0)
  const netTotal = totalDebit - totalCredit
  const isBalanced = netTotal === 0

  const transfer = () => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid positive amount')
      setSuccess(null)
      return
    }

    if (from === to) {
      setError('Source and destination must be different')
      setSuccess(null)
      return
    }

    const fromAccount = accounts[from as keyof typeof accounts]
    if (fromAccount.balance < amt) {
      setError(`Insufficient funds in "${fromAccount.name}". Balance: $${fromAccount.balance.toFixed(2)}`)
      setSuccess(null)
      return
    }

    setError(null)
    setSuccess(null)

    const fromName = accounts[from as keyof typeof accounts].name
    const toName = accounts[to as keyof typeof accounts].name

    let desc: string
    if (transferType === 'payment') {
      desc = `Payment $${amt.toFixed(2)}: ${fromName} -> ${toName}`
    } else if (transferType === 'refund') {
      desc = `Refund $${amt.toFixed(2)}: ${toName} -> ${fromName}`
    } else {
      desc = `Escrow release $${amt.toFixed(2)}: ${fromName} -> ${toName}`
    }

    const newEntries: Entry[] = [
      { id: nextId.current++, account: fromName, debit: amt, credit: 0, description: desc },
      { id: nextId.current++, account: toName, debit: 0, credit: amt, description: desc },
    ]

    setEntries(prev => [...prev, ...newEntries])
    setAccounts(prev => ({
      ...prev,
      [from]: { ...prev[from as keyof typeof prev], balance: prev[from as keyof typeof prev].balance - amt },
      [to]: { ...prev[to as keyof typeof prev], balance: prev[to as keyof typeof prev].balance + amt },
    }))
    setAmount('')
    setSuccess(`Transferred $${amt.toFixed(2)} from ${fromName} to ${toName}`)

    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    }, 50)
  }

  const resetLedger = () => {
    setAccounts(initialAccounts)
    setEntries([
      { id: 0, account: 'Merchant Account', debit: 0, credit: 5000, description: 'Initial balance' },
      { id: 1, account: 'Customer Account', debit: 0, credit: 3000, description: 'Initial balance' },
    ])
    nextId.current = 2
    setError(null)
    setSuccess(null)
    setAmount('')
  }

  const h2: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 12 }

  return (
    <DemoBoundary name="Double-Entry Ledger">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>Double-Entry Ledger</div>
      <p style={{ color: s.text2, fontSize: 13, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Every financial transaction has two sides: a debit from one account and a credit to another.
        The sum of all debits must always equal the sum of all credits. This is double-entry accounting.
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(accounts).map(([key, acc]) => (
          <div key={key} style={{
            flex: 1, minWidth: 180, background: s.bg2, border: `1px solid ${s.border}`,
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{acc.name}</div>
            <div style={{ color: s.text, fontFamily: s.mono, fontSize: 22, fontWeight: 700, marginTop: 4 }}>
              ${acc.balance.toFixed(2)}
            </div>
            <div style={{ color: acc.balance >= 0 ? s.green : s.red, fontSize: 11, marginTop: 2 }}>
              {acc.balance >= 0 ? 'Positive balance' : 'Negative balance'}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
        <div style={h2}>New Transfer</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ color: s.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>From</label>
            <select value={from} onChange={e => setFrom(e.target.value)} style={{
              width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
              padding: '8px 10px', color: s.text, fontSize: 13,
            }}>
              <option value="A">Merchant Account</option>
              <option value="B">Customer Account</option>
              <option value="C">Platform Escrow</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ color: s.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>To</label>
            <select value={to} onChange={e => setTo(e.target.value)} style={{
              width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
              padding: '8px 10px', color: s.text, fontSize: 13,
            }}>
              <option value="A">Merchant Account</option>
              <option value="B">Customer Account</option>
              <option value="C">Platform Escrow</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label style={{ color: s.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>Amount ($)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{
              width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
              padding: '8px 10px', color: s.text, fontSize: 13, fontFamily: s.mono,
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ color: s.text3, fontSize: 11, display: 'block', marginBottom: 4 }}>Type</label>
            <select value={transferType} onChange={e => setTransferType(e.target.value as any)} style={{
              width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
              padding: '8px 10px', color: s.text, fontSize: 13,
            }}>
              <option value="payment">Payment</option>
              <option value="refund">Refund</option>
              <option value="escrow">Escrow Release</option>
            </select>
          </div>
          <div>
            <button onClick={transfer} style={{
              background: s.accent, border: 'none', borderRadius: 6, padding: '8px 18px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, height: 34, marginTop: 20,
            }}>
              Transfer
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: `${s.red}12`, border: `1px solid ${s.red}`, borderRadius: 6, padding: '8px 12px', color: s.red, fontSize: 12, marginTop: 8 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: `${s.green}12`, border: `1px solid ${s.green}`, borderRadius: 6, padding: '8px 12px', color: s.green, fontSize: 12, marginTop: 8 }}>
            {success}
          </div>
        )}
      </div>

      <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={h2}>Ledger Entries</div>
          <button onClick={resetLedger} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6,
            padding: '5px 12px', color: s.text2, cursor: 'pointer', fontSize: 11,
          }}>
            Reset Ledger
          </button>
        </div>
        <div ref={listRef} style={{ maxHeight: 240, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ color: s.text3, borderBottom: `1px solid ${s.border}` }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500 }}>Account</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 500 }}>Debit</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 500 }}>Credit</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: `1px solid ${s.border}`, color: s.text }}>
                  <td style={{ padding: '6px 8px' }}>{entry.account}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: entry.debit > 0 ? s.red : s.text3, fontFamily: s.mono }}>
                    {entry.debit > 0 ? `-$${entry.debit.toFixed(2)}` : ''}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: entry.credit > 0 ? s.green : s.text3, fontFamily: s.mono }}>
                    {entry.credit > 0 ? `+$${entry.credit.toFixed(2)}` : ''}
                  </td>
                  <td style={{ padding: '6px 8px', color: s.text2 }}>{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        background: isBalanced ? `${s.green}12` : `${s.red}12`,
        border: `1px solid ${isBalanced ? s.green : s.red}`,
        borderRadius: 10, padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ color: isBalanced ? s.green : s.red, fontSize: 13, fontWeight: 600 }}>
            {isBalanced ? 'Ledger is Balanced' : 'Ledger is Imbalanced!'}
          </div>
          <div style={{ color: s.text2, fontSize: 12, marginTop: 2 }}>
            Total Debits: ${totalDebit.toFixed(2)} | Total Credits: ${totalCredit.toFixed(2)} | Net: ${netTotal.toFixed(2)}
          </div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: isBalanced ? s.green : s.red,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isBalanced ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 5l8 8M13 5l-8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
