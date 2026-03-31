import { Component, type ReactNode } from 'react'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#3c6bc3',
  green: '#5a9e8e',
  red: '#c46060',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Props {
  children: ReactNode
  name?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class DemoBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: 24,
          background: s.bg2,
          border: `1px solid ${s.red}`,
          borderRadius: 10,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>
          <div style={{
            color: s.red,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: s.mono,
            marginBottom: 8,
          }}>
            Demo Error
          </div>
          <div style={{
            color: s.text2,
            fontSize: 13,
            lineHeight: 1.5,
          }}>
            {this.props.name || 'This demo'} encountered an error and cannot be displayed.
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 12,
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              padding: '6px 14px',
              color: s.text2,
              fontFamily: s.mono,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
