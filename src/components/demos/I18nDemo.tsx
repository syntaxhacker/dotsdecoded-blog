import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-yaml'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Locale = 'en' | 'es' | 'fr' | 'ja'

const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Espanol',
  fr: 'Francais',
  ja: 'Japanese',
}

const localeFlags: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  ja: 'JA',
}

interface Translation {
  key: string
  en: string
  es: string
  fr: string
  ja: string
  interpolate?: boolean
  plural?: boolean
}

const translations: Translation[] = [
  {
    key: 'hello',
    en: 'Hello, World!',
    es: 'Hola, Mundo!',
    fr: 'Bonjour, Monde!',
    ja: 'Hello, World!',
    interpolate: false,
    plural: false,
  },
  {
    key: 'greeting',
    en: 'Hello, %{name}! Welcome to %{app}.',
    es: 'Hola, %{name}! Bienvenido a %{app}.',
    fr: 'Bonjour, %{name}! Bienvenue sur %{app}.',
    ja: '%{name}, %{app}へようこそ!',
    interpolate: true,
    plural: false,
  },
  {
    key: 'items_count',
    en: 'You have %{count} item. |||| You have %{count} items.',
    es: 'Tienes %{count} elemento. |||| Tienes %{count} elementos.',
    fr: 'Vous avez %{count} element. |||| Vous avez %{count} elements.',
    ja: '%{count}個のアイテムがあります。',
    interpolate: true,
    plural: true,
  },
  {
    key: 'save',
    en: 'Save',
    es: 'Guardar',
    fr: 'Enregistrer',
    ja: '保存',
    interpolate: false,
    plural: false,
  },
  {
    key: 'delete_confirm',
    en: 'Are you sure you want to delete this?',
    es: 'Estas seguro de que quieres eliminar esto?',
    fr: 'Etes-vous sur de vouloir supprimer ceci?',
    ja: '本当に削除しますか?',
    interpolate: false,
    plural: false,
  },
  {
    key: 'last_login',
    en: 'Last login: %{time} ago',
    es: 'Ultimo inicio de sesion: hace %{time}',
    fr: 'Derniere connexion: il y a %{time}',
    ja: '最終ログイン: %{time}前',
    interpolate: true,
    plural: false,
  },
]

function resolveTranslation(t: Translation, locale: Locale, count: number): string {
  const raw = t[locale]
  if (t.plural) {
    const forms = raw.split('||||')
    const idx = locale === 'ja' ? 0 : count === 1 ? 0 : 1
    const form = (forms[idx] || forms[0]).trim()
    return form.replace('%{count}', String(count))
  }
  let result = raw
  if (t.interpolate) {
    result = result.replace('%{name}', 'Alice').replace('%{app}', 'DotsDecoded').replace('%{time}', '2 hours')
  }
  return result
}

export default function I18nDemo() {
  const [locale, setLocale] = useState<Locale>('en')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [pluralCount, setPluralCount] = useState(3)

  const selected = translations.find((t) => t.key === selectedKey)

  const yamlHtml = useMemo(() => {
    const code = `${locale}:
  hello: "${translations[0][locale]}"
  greeting: "${translations[1][locale]}"
  save: "${translations[3][locale]}"
  delete_confirm: "${translations[4][locale]}"
  last_login: "${translations[5][locale]}"`
    return Prism.highlight(code, Prism.languages.yaml, 'yaml')
  }, [locale])

  return (
    <DemoBoundary name="I18n Demo">
      <div className="i8c" style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
.i8c code .token.keyword { color: #f92672; }
.i8c code .token.string, .i8c code .token.char, .i8c code .token.builtin, .i8c code .token.inserted { color: #e6db74; }
.i8c code .token.number, .i8c code .token.constant, .i8c code .token.symbol, .i8c code .token.property, .i8c code .token.tag, .i8c code .token.boolean, .i8c code .token.deleted { color: #ae81ff; }
.i8c code .token.selector, .i8c code .token.attr-name { color: #f92672; }
.i8c code .token.attr-value, .i8c code .token.atrule { color: #e6db74; }
.i8c code .token.function, .i8c code .token.class-name { color: #a6e22e; }
.i8c code .token.operator, .i8c code .token.entity, .i8c code .token.url, .i8c code .token.punctuation { color: #f8f8f2; }
.i8c code .token.comment, .i8c code .token.prolog, .i8c code .token.doctype, .i8c code .token.cdata { color: #75715e; font-style: italic; }
.i8c code .token.parameter, .i8c code .token.variable, .i8c code .token.regex, .i8c code .token.important { color: #fd971f; }
        `}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ color: s.text3, fontSize: 12, fontFamily: s.mono, marginRight: 4 }}>LOCALE:</span>
          {(Object.keys(localeNames) as Locale[]).map((loc) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              style={{
                background: locale === loc ? s.accent : s.bg2,
                border: `1px solid ${locale === loc ? s.accent : s.border}`,
                borderRadius: 6,
                padding: '5px 12px',
                color: locale === loc ? '#fff' : s.text2,
                fontFamily: s.mono,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {localeFlags[loc]} {localeNames[loc]}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Translation Preview
            </div>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
                <span style={{ color: s.text2, fontSize: 11, fontFamily: s.mono }}>Sample Page ({localeNames[locale]})</span>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {translations.map((t) => (
                    <div key={t.key}>
                      <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, marginBottom: 3 }}>
                        t("{t.key}")
                      </div>
                      <div
                        onClick={() => setSelectedKey(t.key === selectedKey ? null : t.key)}
                        style={{
                          background: selectedKey === t.key ? s.bg3 : 'transparent',
                          border: `1px solid ${selectedKey === t.key ? s.accent : 'transparent'}`,
                          borderRadius: 6,
                          padding: '8px 12px',
                          color: s.text,
                          fontSize: 14,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {resolveTranslation(t, locale, pluralCount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              YAML Locale File
            </div>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.yellow }} />
                <span style={{ color: s.text2, fontSize: 11, fontFamily: s.mono }}>config/locales/{locale}.yml</span>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontFamily: s.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>
                  <code dangerouslySetInnerHTML={{ __html: yamlHtml }} />
                </div>
                {selected?.plural && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: s.bg3, borderRadius: 6 }}>
                    <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, marginBottom: 6 }}>PLURALIZATION RULE</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => setPluralCount(Math.max(0, pluralCount - 1))}
                        style={{
                          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4,
                          width: 28, height: 28, color: s.text, fontFamily: s.mono, fontSize: 14, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >-</button>
                      <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 16, minWidth: 24, textAlign: 'center' }}>{pluralCount}</span>
                      <button
                        onClick={() => setPluralCount(pluralCount + 1)}
                        style={{
                          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4,
                          width: 28, height: 28, color: s.text, fontFamily: s.mono, fontSize: 14, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >+</button>
                      <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>count</span>
                    </div>
                    <div style={{ color: s.green, fontSize: 13, marginTop: 8, fontFamily: s.mono }}>
                      Result: {resolveTranslation(selected, locale, pluralCount)}
                    </div>
                  </div>
                )}
                {selected?.interpolate && !selected.plural && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: s.bg3, borderRadius: 6 }}>
                    <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, marginBottom: 6 }}>INTERPOLATION</div>
                    <div style={{ color: s.purple, fontSize: 12, fontFamily: s.mono }}>
                      {`t("greeting", name: "Alice", app: "DotsDecoded")`}
                    </div>
                    <div style={{ color: s.green, fontSize: 13, marginTop: 6, fontFamily: s.mono }}>
                      {'=> "'}{resolveTranslation(selected, locale, pluralCount)}{'"'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
