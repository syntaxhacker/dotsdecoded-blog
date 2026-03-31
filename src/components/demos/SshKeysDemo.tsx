import { useState, useEffect, useRef, useCallback } from 'react'
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

function useTerminal(lines: string[], delay = 30) {
  const [displayed, setDisplayed] = useState<string[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed([])
    setDone(false)
    let i = 0
    const timer = setInterval(() => {
      if (i < lines.length) {
        setDisplayed(prev => [...prev, lines[i]])
        i++
      } else {
        setDone(true)
        clearInterval(timer)
      }
    }, delay)
    return () => clearInterval(timer)
  }, [JSON.stringify(lines), delay])

  return { displayed, done }
}

function Terminal({ lines, title = 'terminal' }: { lines: string[]; title?: string }) {
  const termRef = useRef<HTMLDivElement>(null)
  const safeLines = Array.isArray(lines) ? lines.filter(Boolean) : []

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [safeLines])

  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 8,
      overflow: 'hidden',
      marginTop: 12,
    }}>
      <div style={{
        background: s.bg2,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: `1px solid ${s.border}`,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.red }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.yellow }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.green }} />
        </div>
        <span style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>{title}</span>
      </div>
      <div
        ref={termRef}
        style={{
          padding: 12,
          maxHeight: 300,
          overflowY: 'auto',
          fontFamily: s.mono,
          fontSize: 13,
          lineHeight: 1.6,
          color: s.text,
        }}
      >
        {safeLines.map((line, i) => (
          <div key={i} style={{
            color: line.includes('[FAIL]') ? s.red
              : line.includes('[OK]') || line.includes('[SUCCESS]') ? s.green
              : line.startsWith('$') ? s.accent
              : s.text,
          }}>
            {line}
          </div>
        ))}
        {safeLines.length === 0 && (
          <div style={{ color: s.text3 }}>waiting for input...</div>
        )}
      </div>
    </div>
  )
}

function PasswordSection() {
  const [password, setPassword] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [failCount, setFailCount] = useState(0)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (success) return

    if (password.trim().toLowerCase() === 'ssh') {
      setLogs(prev => [...prev, `$ ssh user@server.com`, `user@server.com's password: ${'*'.repeat(password.length)}`, `[SUCCESS] Authentication successful!`, 'Welcome to Ubuntu 22.04 LTS (GNU/Linux 5.15.0)', '', 'Last login: Mon Mar 30 08:15:32 2026 from 10.0.0.1', '$ _'])
      setSuccess(true)
    } else {
      const newCount = failCount + 1
      setFailCount(newCount)
      setLogs(prev => [...prev, `$ ssh user@server.com`, `user@server.com's password: ${'*'.repeat(password.length)}`, `[FAIL] Permission denied (publickey,password). [Attempt ${newCount}/3]`])
      if (newCount >= 3) {
        setLogs(prev => [...prev, '', 'Connection closed by remote host.'])
      }
    }
    setPassword('')
  }, [password, failCount, success])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 6,
          padding: '6px 14px',
          color: s.text3,
          fontSize: 13,
        }}>
          Failed attempts: <span style={{ color: failCount > 0 ? s.red : s.text3, fontWeight: 600 }}>{failCount}</span>/3
        </div>
        {success && (
          <div style={{
            background: s.green + '1a',
            border: `1px solid ${s.green}`,
            borderRadius: 6,
            padding: '6px 14px',
            color: s.green,
            fontSize: 13,
          }}>
            Access granted
          </div>
        )}
      </div>
      <Terminal lines={logs} title="ssh password auth" />
      <form onSubmit={handleSubmit} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 13, alignSelf: 'center' }}>$</span>
        <input
          ref={inputRef}
          type="text"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Type any password (hint: 'ssh' to succeed)"
          disabled={success || failCount >= 3}
          style={{
            flex: 1,
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 6,
            padding: '8px 12px',
            color: s.text,
            fontFamily: s.mono,
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={success || failCount >= 3 || !password}
          style={{
            background: password && !success && failCount < 3 ? s.accent : s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 6,
            padding: '8px 16px',
            color: password && !success && failCount < 3 ? '#fff' : s.text3,
            fontFamily: s.mono,
            fontSize: 13,
            cursor: password && !success && failCount < 3 ? 'pointer' : 'not-allowed',
          }}
        >
          Login
        </button>
      </form>
      {(success || failCount >= 3) && (
        <button
          onClick={() => { setLogs([]); setFailCount(0); setSuccess(false); }}
          style={{
            marginTop: 8,
            background: 'transparent',
            border: `1px solid ${s.border}`,
            borderRadius: 6,
            padding: '6px 14px',
            color: s.text2,
            fontFamily: s.mono,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      )}
    </div>
  )
}

function KeyPairSection() {
  const [showPrivate, setShowPrivate] = useState(false)

  const privKey = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIA
AAAABGhjcnAAAAAAAAABAAAAMwAAAAtzc2gtZWQy
NTUxOQAAACD8K7V3mF6x9JYn2LpQR4sTkV+N7FqS
XaVbRZkM3HcAAAAJdXNlckBkb3RzLmRldgAAAECb
xR9n+PT2L7vF5zKq8WmF2R3hT5vN7cXpLqYr4sT8
hK9mF2V3ZpQr8Xk7nL5vF2C3H8sT5mKq9LpXr4Y2N
Z3RkLmRlY29kZWQuY29tAAAAFG1hc0Bkb3RzZGVj
b2RlZC5jb20=
-----END OPENSSH PRIVATE KEY-----
# THIS IS A DUMMY KEY FOR DEMO PURPOSES ONLY
# Not a real private key. Never use in production.`

  const pubKey = `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIODwrtXeYXrH0lifYulBHiJORX43sWpJdpVtFmQzcdw user@dotsdecoded.com`

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <div style={{
        flex: '1 1 280px',
        background: s.bg,
        border: `1px solid ${s.red}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 14px',
          background: s.red + '1a',
          borderBottom: `1px solid ${s.red}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ color: s.red, fontWeight: 600, fontSize: 13 }}>Private Key</div>
            <div style={{ color: s.text3, fontSize: 11 }}>~/.ssh/id_ed25519</div>
          </div>
          <span style={{
            background: s.red,
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 4,
            letterSpacing: 0.5,
          }}>
            NEVER SHARE
          </span>
        </div>
        <div style={{ padding: 12, fontFamily: s.mono, fontSize: 11, wordBreak: 'break-all' }}>
          {showPrivate ? (
            <div style={{ color: s.text2 }}>{privKey}</div>
          ) : (
            <div style={{ color: s.text3, textAlign: 'center', padding: '20px 0' }}>
              [Content hidden for security]
            </div>
          )}
        </div>
        <div style={{ padding: '0 12px 12px' }}>
          <button
            onClick={() => setShowPrivate(!showPrivate)}
            style={{
              width: '100%',
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              padding: '6px',
              color: s.text2,
              fontFamily: s.mono,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {showPrivate ? 'Hide' : 'Reveal'} private key
          </button>
        </div>
      </div>
      <div style={{
        flex: '1 1 280px',
        background: s.bg,
        border: `1px solid ${s.green}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 14px',
          background: s.green + '1a',
          borderBottom: `1px solid ${s.green}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ color: s.green, fontWeight: 600, fontSize: 13 }}>Public Key</div>
            <div style={{ color: s.text3, fontSize: 11 }}>~/.ssh/id_ed25519.pub</div>
          </div>
          <span style={{
            background: s.green,
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 4,
            letterSpacing: 0.5,
          }}>
            SAFE TO SHARE
          </span>
        </div>
        <div style={{ padding: 12, fontFamily: s.mono, fontSize: 11, wordBreak: 'break-all', color: s.text2 }}>
          {pubKey}
        </div>
      </div>
    </div>
  )
}

function KeygenSection() {
  const [algo, setAlgo] = useState<'ed25519' | 'rsa'>('ed25519')
  const [lines, setLines] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)

  const ed25519Output = [
    '$ ssh-keygen -t ed25519 -C "user@dotsdecoded.com"',
    'Generating public/private ed25519 key pair.',
    'Enter file in which to save the key (/home/user/.ssh/id_ed25519):',
    'Created directory \'/home/user/.ssh\'.',
    'Enter passphrase (empty for no passphrase):',
    'Enter same passphrase again:',
    'Your identification has been saved in /home/user/.ssh/id_ed25519',
    'Your public key has been saved in /home/user/.ssh/id_ed25519.pub',
    'The key fingerprint is:',
    'SHA256:8KvV3mF6x9JYn2LpQR4sTkV+N7FqSXaVbRZkM3Hc user@dotsdecoded.com',
    'The key\'s randomart image is:',
    '+--[ED25519 256]--+',
    '|    o.o..         |',
    '|   . .+.  .       |',
    '|  . . o..+        |',
    '| . + . ..S .      |',
    '|  = o   .E .      |',
    '|   + . . o .      |',
    '|    .   . o       |',
    '+----[SHA256]-----+',
    '[OK] Key pair generated successfully!',
  ]

  const rsaOutput = [
    '$ ssh-keygen -t rsa -b 4096 -C "user@dotsdecoded.com"',
    'Generating public/private rsa key pair.',
    'Enter file in which to save the key (/home/user/.ssh/id_rsa):',
    '/home/user/.ssh/id_rsa already exists.',
    'Overwrite (y/n)? y',
    'Enter passphrase (empty for no passphrase):',
    'Enter same passphrase again:',
    'Your identification has been saved in /home/user/.ssh/id_rsa',
    'Your public key has been saved in /home/user/.ssh/id_rsa.pub',
    'The key fingerprint is:',
    'SHA256:nThbgkqU+JdF2H8E5r1kY+p3NqX9LmK5VbRZkM3Hc user@dotsdecoded.com',
    'The key\'s randomart image is:',
    '+--[RSA 4096]----+',
    '|       ..o..     |',
    '|      .  + .     |',
    '|     .  . o      |',
    '|    o ..S .      |',
    '|   . +.E. .      |',
    '|    o .+. .      |',
    '|     . . .       |',
    '+----[SHA256]-----+',
    '[OK] Key pair generated successfully!',
  ]

  const handleGenerate = () => {
    setLines([])
    setGenerating(true)
    setDone(false)
    const output = algo === 'ed25519' ? ed25519Output : rsaOutput
    let i = 0
    const timer = setInterval(() => {
      if (i < output.length) {
        setLines(prev => [...prev, output[i]])
        i++
      } else {
        setGenerating(false)
        setDone(true)
        clearInterval(timer)
      }
    }, 60)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => setAlgo('ed25519')}
          style={{
            background: algo === 'ed25519' ? s.accent : s.bg2,
            border: `1px solid ${algo === 'ed25519' ? s.accent : s.border}`,
            borderRadius: 6,
            padding: '8px 16px',
            color: algo === 'ed25519' ? '#fff' : s.text2,
            fontFamily: s.mono,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ed25519
        </button>
        <button
          onClick={() => setAlgo('rsa')}
          style={{
            background: algo === 'rsa' ? s.accent : s.bg2,
            border: `1px solid ${algo === 'rsa' ? s.accent : s.border}`,
            borderRadius: 6,
            padding: '8px 16px',
            color: algo === 'rsa' ? '#fff' : s.text2,
            fontFamily: s.mono,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          RSA 4096
        </button>
      </div>
      <div style={{
        background: s.bg2,
        border: `1px solid ${s.border}`,
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
        color: s.text2,
        fontSize: 13,
        lineHeight: 1.5,
      }}>
        {algo === 'ed25519'
          ? 'ed25519 is the modern default. Uses elliptic curve cryptography (Curve25519). Keys are compact (just 68 bytes), fast to generate, and immune to most known attacks. Recommended by OpenSSH since version 6.5.'
          : 'RSA 4096 uses 4096-bit keys based on integer factorization. Older but widely supported. Larger keys (736 bytes), slower to generate and authenticate. Use only when ed25519 is not supported by the server.'}
      </div>
      <Terminal lines={lines} title={`ssh-keygen -t ${algo}`} />
      <button
        onClick={handleGenerate}
        disabled={generating}
        style={{
          marginTop: 12,
          background: generating ? s.bg2 : s.accent,
          border: `1px solid ${s.border}`,
          borderRadius: 6,
          padding: '8px 20px',
          color: generating ? s.text3 : '#fff',
          fontFamily: s.mono,
          fontSize: 13,
          cursor: generating ? 'not-allowed' : 'pointer',
        }}
      >
        {generating ? 'Generating...' : done ? 'Generate Again' : 'Generate Key Pair'}
      </button>
    </div>
  )
}

function CopyIdSection() {
  const [serverKeys, setServerKeys] = useState<{ key: string; algo: string; added: boolean }[]>([])
  const [copying, setCopying] = useState<string | null>(null)

  const availableKeys = [
    { algo: 'ed25519', key: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIODwrtXeYXrH0lifYulBHiJORX43sWpJdpVtFmQzcdw user@dotsdecoded.com' },
    { algo: 'rsa', key: 'ssh-rsa AAAAB3NzaC1yc2EAAAAADAQABAAACAQDN3x... user@dotsdecoded.com' },
  ]

  const handleCopy = async (keyInfo: typeof availableKeys[0]) => {
    if (copying || serverKeys.some(k => k.key === keyInfo.key)) return
    setCopying(keyInfo.algo)
    await new Promise(r => setTimeout(r, 800))
    setServerKeys(prev => [...prev, { ...keyInfo, added: true }])
    setCopying(null)
  }

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 280px' }}>
        <div style={{
          color: s.text,
          fontWeight: 600,
          fontSize: 13,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            background: s.accent,
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
          }}>LOCAL</span>
          ~/.ssh/
        </div>
        {availableKeys.map(k => {
          const alreadyCopied = serverKeys.some(sk => sk.key === k.key)
          return (
            <div
              key={k.algo}
              style={{
                background: s.bg,
                border: `1px solid ${alreadyCopied ? s.green : s.border}`,
                borderRadius: 6,
                padding: 10,
                marginBottom: 8,
                fontFamily: s.mono,
                fontSize: 11,
                color: s.text2,
                wordBreak: 'break-all',
                transition: 'border-color 0.3s',
              }}
            >
              <div style={{ color: s.text3, fontSize: 10, marginBottom: 4 }}>
                id_{k.algo}.pub
              </div>
              <div>{k.key}</div>
              <button
                onClick={() => handleCopy(k)}
                disabled={!!copying || alreadyCopied}
                style={{
                  marginTop: 8,
                  background: alreadyCopied ? s.green + '26' : copying === k.algo ? s.bg2 : s.accent,
                  border: `1px solid ${alreadyCopied ? s.green : s.border}`,
                  borderRadius: 4,
                  padding: '4px 12px',
                  color: alreadyCopied ? s.green : copying === k.algo ? s.text3 : '#fff',
                  fontFamily: s.mono,
                  fontSize: 11,
                  cursor: copying || alreadyCopied ? 'not-allowed' : 'pointer',
                }}
              >
                {alreadyCopied ? 'Copied' : copying === k.algo ? 'Copying...' : 'ssh-copy-id'}
              </button>
            </div>
          )
        })}
      </div>
      <div style={{
        flex: '0 0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: s.text3,
        fontSize: 20,
      }}>
        --&gt;
      </div>
      <div style={{ flex: '1 1 280px' }}>
        <div style={{
          color: s.text,
          fontWeight: 600,
          fontSize: 13,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            background: s.green,
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
          }}>REMOTE</span>
          ~/.ssh/authorized_keys
        </div>
        <div style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 6,
          padding: 10,
          minHeight: 120,
          fontFamily: s.mono,
          fontSize: 11,
        }}>
          {serverKeys.length === 0 ? (
            <div style={{ color: s.text3, textAlign: 'center', padding: '30px 0' }}>
              No keys yet. Copy a key from your local machine.
            </div>
          ) : (
            serverKeys.map((k, i) => (
              <div
                key={i}
                style={{
                  color: s.text2,
                  wordBreak: 'break-all',
                  marginBottom: 8,
                  paddingBottom: 8,
                  borderBottom: i < serverKeys.length - 1 ? `1px solid ${s.border}` : 'none',
                  animation: 'fadeIn 0.3s ease',
                }}
              >
                <div style={{ color: s.green, fontSize: 10, marginBottom: 2 }}>
                  [{k.algo}]
                </div>
                {k.key}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function HandshakeSection() {
  const [step, setStep] = useState(-1)
  const [animating, setAnimating] = useState(false)

  const steps = [
    {
      label: 'Client Connects',
      desc: 'TCP connection established to server on port 22',
      from: 'Client',
      to: 'Server',
      color: s.accent,
    },
    {
      label: 'Server Sends Challenge',
      desc: 'Server sends a random challenge string encrypted with the client\'s public key',
      from: 'Server',
      to: 'Client',
      color: s.yellow,
    },
    {
      label: 'Client Signs Challenge',
      desc: 'Client decrypts challenge with private key, signs it, and sends back',
      from: 'Client',
      to: 'Server',
      color: s.accent,
    },
    {
      label: 'Server Verifies Signature',
      desc: 'Server uses the stored public key to verify the client\'s signature',
      from: 'Server',
      to: 'Server',
      color: s.yellow,
    },
    {
      label: 'Access Granted',
      desc: 'Signature matches -- shell session is opened',
      from: 'Server',
      to: 'Client',
      color: s.green,
    },
  ]

  const startHandshake = useCallback(() => {
    setStep(-1)
    setAnimating(true)
    let current = 0
    const timer = setInterval(() => {
      if (current <= 4) {
        setStep(current)
        current++
      } else {
        setAnimating(false)
        clearInterval(timer)
      }
    }, 1200)
  }, [])

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        marginBottom: 20,
        padding: '20px 0',
      }}>
        <div style={{
          background: s.bg,
          border: `1px solid ${step >= 0 ? s.accent : s.border}`,
          borderRadius: 8,
          padding: '12px 20px',
          textAlign: 'center',
          transition: 'border-color 0.5s',
        }}>
          <div style={{ color: s.accent, fontSize: 11, fontFamily: s.mono, marginBottom: 4 }}>LOCAL</div>
          <div style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>Client</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {steps.map((st, i) => {
            const isActive = i === step
            const isDone = i < step
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: isDone || isActive ? 1 : 0.2,
                transition: 'opacity 0.4s',
                margin: 2,
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isDone || isActive ? steps[i].color : s.border,
                  transition: 'background 0.4s',
                }} />
                <span style={{
                  color: isActive || isDone ? steps[i].color : s.text3,
                  fontSize: 10,
                  fontFamily: s.mono,
                  whiteSpace: 'nowrap',
                  transition: 'color 0.4s',
                }}>
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>

        <div style={{
          background: s.bg,
          border: `1px solid ${step >= 4 ? s.green : s.border}`,
          borderRadius: 8,
          padding: '12px 20px',
          textAlign: 'center',
          transition: 'border-color 0.5s',
        }}>
          <div style={{ color: s.green, fontSize: 11, fontFamily: s.mono, marginBottom: 4 }}>REMOTE</div>
          <div style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>Server</div>
        </div>
      </div>

      {step >= 0 && step < 5 && (
        <div style={{
          background: s.bg,
          border: `1px solid ${steps[step].color}`,
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          transition: 'border-color 0.3s',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              color: steps[step].color,
              fontFamily: s.mono,
              fontSize: 13,
              fontWeight: 600,
            }}>
              Step {step + 1}: {steps[step].label}
            </span>
            <span style={{
              color: s.text3,
              fontSize: 11,
              fontFamily: s.mono,
            }}>
              {steps[step].from} --&gt; {steps[step].to}
            </span>
          </div>
          <div style={{ color: s.text2, fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
            {steps[step].desc}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={startHandshake}
          disabled={animating}
          style={{
            background: animating ? s.bg2 : s.accent,
            border: `1px solid ${s.border}`,
            borderRadius: 6,
            padding: '8px 20px',
            color: animating ? s.text3 : '#fff',
            fontFamily: s.mono,
            fontSize: 13,
            cursor: animating ? 'not-allowed' : 'pointer',
          }}
        >
          {animating ? 'Handshaking...' : step >= 4 ? 'Restart Handshake' : 'Start Handshake'}
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: i <= step ? steps[i].color : s.bg2,
                border: `1px solid ${i <= step ? steps[i].color : s.border}`,
                transition: 'all 0.4s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function QuickSetupSection() {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: 'Generate your key pair',
      cmd: 'ssh-keygen -t ed25519 -C "your_email@example.com"',
      explanation: 'This creates a new ed25519 SSH key pair with your email as a label. Press Enter to accept the default file location, and optionally set a passphrase for extra security.',
    },
    {
      title: 'Copy the public key to your server',
      cmd: 'ssh-copy-id user@your-server.com',
      explanation: 'This appends your public key to the server\'s ~/.ssh/authorized_keys file. You will be prompted for your server password one last time. After this, you can log in without a password.',
    },
    {
      title: 'Test your connection',
      cmd: 'ssh user@your-server.com',
      explanation: 'If everything is set up correctly, you will be logged in immediately without being asked for a password. The SSH daemon on the server verifies your identity using your public key.',
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            style={{
              background: i === currentStep ? s.accent : s.bg2,
              border: `1px solid ${i === currentStep ? s.accent : s.border}`,
              borderRadius: 6,
              padding: '8px 16px',
              color: i === currentStep ? '#fff' : i < currentStep ? s.green : s.text3,
              fontFamily: s.mono,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {i < currentStep ? '[OK] ' : ''}Step {i + 1}
          </button>
        ))}
      </div>
      <div style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        padding: 16,
        transition: 'all 0.3s',
      }}>
        <div style={{
          color: s.accent,
          fontWeight: 600,
          fontSize: 15,
          marginBottom: 12,
        }}>
          {currentStep + 1}. {steps[currentStep].title}
        </div>
        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 6,
          padding: '10px 14px',
          fontFamily: s.mono,
          fontSize: 13,
          color: s.green,
          marginBottom: 12,
        }}>
          $ {steps[currentStep].cmd}
        </div>
        <div style={{
          color: s.text2,
          fontSize: 13,
          lineHeight: 1.6,
        }}>
          {steps[currentStep].explanation}
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          style={{
            background: 'transparent',
            border: `1px solid ${s.border}`,
            borderRadius: 6,
            padding: '6px 16px',
            color: currentStep === 0 ? s.text3 : s.text2,
            fontFamily: s.mono,
            fontSize: 12,
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          style={{
            background: 'transparent',
            border: `1px solid ${s.border}`,
            borderRadius: 6,
            padding: '6px 16px',
            color: currentStep === steps.length - 1 ? s.text3 : s.text2,
            fontFamily: s.mono,
            fontSize: 12,
            cursor: currentStep === steps.length - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{
      background: s.bg2,
      border: `1px solid ${s.border}`,
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderBottom: open ? `1px solid ${s.border}` : 'none',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          background: s.accent,
          color: '#fff',
          width: 26,
          height: 26,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: s.mono,
          flexShrink: 0,
        }}>
          {number}
        </span>
        <span style={{
          color: s.text,
          fontSize: 15,
          fontWeight: 600,
          flex: 1,
        }}>
          {title}
        </span>
        <span style={{
          color: s.text3,
          fontSize: 18,
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}>
          v
        </span>
      </button>
      {open && (
        <div style={{ padding: '16px 18px 20px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function SshKeysDemo() {
  return (
    <DemoBoundary name="SSH Key Authentication">
    <div style={{
      maxWidth: 820,
      margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: s.text,
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: 24,
        padding: '20px 0',
      }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: s.text }}>
          SSH Key Authentication
        </h2>
        <p style={{ margin: '8px 0 0', color: s.text3, fontSize: 14 }}>
          Interactive guide to understanding and setting up SSH keys
        </p>
      </div>

      <Section number={1} title="The Problem: Password Authentication">
        <div style={{ color: s.text2, fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
          Password authentication is vulnerable to brute-force attacks, phishing, and keylogging. Try logging in below. Type <code style={{ background: s.bg, padding: '1px 6px', borderRadius: 3, fontFamily: s.mono, fontSize: 12, color: s.accent }}>ssh</code> as the password to succeed.
        </div>
        <PasswordSection />
      </Section>

      <Section number={2} title="The Solution: Key Pairs">
        <div style={{ color: s.text2, fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
          SSH uses asymmetric cryptography. A key pair consists of a private key (kept secret on your machine) and a public key (placed on the server). The private key proves your identity without ever transmitting a secret.
        </div>
        <KeyPairSection />
      </Section>

      <Section number={3} title="Generating Keys: ssh-keygen">
        <div style={{ color: s.text2, fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
          Use <code style={{ background: s.bg, padding: '1px 6px', borderRadius: 3, fontFamily: s.mono, fontSize: 12, color: s.accent }}>ssh-keygen</code> to create a new key pair. Choose an algorithm and click generate to see the process.
        </div>
        <KeygenSection />
      </Section>

      <Section number={4} title="Copying Keys: ssh-copy-id">
        <div style={{ color: s.text2, fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
          Before you can authenticate with your key, the public key must be added to the server's authorized_keys file. Click the buttons to simulate this process.
        </div>
        <CopyIdSection />
      </Section>

      <Section number={5} title="The SSH Handshake">
        <div style={{ color: s.text2, fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
          When you run <code style={{ background: s.bg, padding: '1px 6px', borderRadius: 3, fontFamily: s.mono, fontSize: 12, color: s.accent }}>ssh user@server</code>, a challenge-response protocol takes place. Click to watch the handshake unfold.
        </div>
        <HandshakeSection />
      </Section>

      <Section number={6} title="Quick Setup Guide">
        <div style={{ color: s.text2, fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
          Three commands to get SSH key authentication working. Click through each step.
        </div>
        <QuickSetupSection />
      </Section>
    </div>
    </DemoBoundary>
  )
}
