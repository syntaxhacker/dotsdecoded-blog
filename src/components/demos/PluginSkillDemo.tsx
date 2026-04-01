import { useState } from 'react'
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

interface Skill {
  name: string
  description: string
  allowedTools: string[]
  model: string
  whenToUse: string
}

interface Plugin {
  name: string
  description: string
  skills: string[]
  hooks: string[]
  mcpServers: string[]
  commands: string[]
  color: string
}

const skills: Record<string, Skill> = {
  batch: {
    name: 'batch',
    description: 'Execute multiple tool calls in parallel when operations are independent.',
    allowedTools: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When multiple independent file reads or edits are needed at once.',
  },
  debug: {
    name: 'debug',
    description: 'Systematically diagnose and fix errors using logs, breakpoints, and stack traces.',
    allowedTools: ['Read', 'Bash', 'Grep', 'Glob', 'Edit'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When an error or unexpected behavior needs investigation and a fix.',
  },
  loop: {
    name: 'loop',
    description: 'Run an iterative agent loop that retries tasks until they pass verification.',
    allowedTools: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep', 'Task'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When a task may require multiple attempts to complete successfully.',
  },
  verify: {
    name: 'verify',
    description: 'Run lint, typecheck, and tests to confirm changes are correct.',
    allowedTools: ['Bash', 'Read'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'After making code changes to ensure nothing is broken.',
  },
  simplify: {
    name: 'simplify',
    description: 'Reduce code complexity while preserving behavior and test coverage.',
    allowedTools: ['Read', 'Edit', 'Grep', 'Glob', 'Bash'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When code is overly complex or hard to understand.',
  },
  commit: {
    name: 'commit',
    description: 'Stage relevant files and create a well-formatted git commit message.',
    allowedTools: ['Bash', 'Read'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When the user asks to commit changes to the repository.',
  },
  review: {
    name: 'review',
    description: 'Analyze code changes for correctness, style, and potential issues.',
    allowedTools: ['Read', 'Glob', 'Grep', 'Bash'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When the user asks for a code review of recent changes.',
  },
  refactor: {
    name: 'refactor',
    description: 'Restructure code to improve design without changing external behavior.',
    allowedTools: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When code needs structural improvements while keeping the same behavior.',
  },
  test: {
    name: 'test',
    description: 'Generate comprehensive tests based on existing code and its patterns.',
    allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When the user asks to write or generate tests for existing code.',
  },
  explain: {
    name: 'explain',
    description: 'Break down complex code or concepts into clear, digestible explanations.',
    allowedTools: ['Read', 'Glob', 'Grep'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When the user asks how something works or what a piece of code does.',
  },
  migrate: {
    name: 'migrate',
    description: 'Upgrade dependencies, APIs, or syntax patterns across a codebase.',
    allowedTools: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When moving between versions of a library, framework, or language.',
  },
  optimize: {
    name: 'optimize',
    description: 'Improve performance by identifying bottlenecks and applying targeted fixes.',
    allowedTools: ['Read', 'Edit', 'Bash', 'Grep', 'Glob'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When the user asks to make code faster or more efficient.',
  },
  document: {
    name: 'document',
    description: 'Generate and update documentation from code structure and intent.',
    allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When documentation is missing, outdated, or needs to be created.',
  },
  deploy: {
    name: 'deploy',
    description: 'Guide through deployment steps and verify build output.',
    allowedTools: ['Bash', 'Read', 'Glob'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When preparing to ship code to a staging or production environment.',
  },
  search: {
    name: 'search',
    description: 'Deeply search a codebase using multiple strategies to find relevant code.',
    allowedTools: ['Grep', 'Glob', 'Read', 'Bash'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When looking for specific code patterns, usages, or implementations.',
  },
  resolve: {
    name: 'resolve',
    description: 'Diagnose and fix merge conflicts, dependency issues, and integration errors.',
    allowedTools: ['Read', 'Edit', 'Bash', 'Grep', 'Glob'],
    model: 'claude-sonnet-4-20250514',
    whenToUse: 'When facing merge conflicts or dependency resolution problems.',
  },
}

const plugins: Plugin[] = [
  {
    name: 'Core',
    description: 'Foundational skills for everyday development workflows.',
    skills: ['batch', 'debug', 'loop', 'verify', 'simplify'],
    hooks: ['pre-tool-use', 'post-tool-use'],
    mcpServers: [],
    commands: ['/compact', '/clear'],
    color: s.accent,
  },
  {
    name: 'Git',
    description: 'Version control operations and change management.',
    skills: ['commit', 'review', 'resolve'],
    hooks: ['pre-commit'],
    mcpServers: [],
    commands: ['/diff', '/log'],
    color: s.green,
  },
  {
    name: 'Testing',
    description: 'Test generation, execution, and coverage analysis.',
    skills: ['test', 'verify'],
    hooks: ['post-edit'],
    mcpServers: ['coverage-reporter'],
    commands: ['/test'],
    color: s.yellow,
  },
  {
    name: 'Quality',
    description: 'Code quality improvements and performance optimization.',
    skills: ['refactor', 'simplify', 'optimize', 'migrate'],
    hooks: ['pre-commit'],
    mcpServers: ['linter', 'complexity-analyzer'],
    commands: ['/refactor'],
    color: s.purple,
  },
  {
    name: 'Learning',
    description: 'Understanding codebases and generating documentation.',
    skills: ['explain', 'document', 'search'],
    hooks: [],
    mcpServers: ['doc-generator'],
    commands: ['/explain'],
    color: s.orange,
  },
  {
    name: 'Shipping',
    description: 'Build verification and deployment preparation.',
    skills: ['deploy', 'verify', 'document'],
    hooks: ['pre-build', 'post-build'],
    mcpServers: ['build-monitor'],
    commands: ['/deploy'],
    color: s.red,
  },
]

function PluginCard({
  plugin,
  enabled,
  onToggle,
  activeSkills,
}: {
  plugin: Plugin
  enabled: boolean
  onToggle: () => void
  activeSkills: Set<string>
}) {
  const availableSkills = plugin.skills.filter((sk) => activeSkills.has(sk))
  return (
    <div
      style={{
        background: enabled ? s.bg2 : s.bg,
        border: `1px solid ${enabled ? plugin.color : s.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        opacity: enabled ? 1 : 0.45,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <button
          onClick={onToggle}
          style={{
            width: 38,
            height: 20,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            background: enabled ? plugin.color : s.bg3,
            position: 'relative',
            transition: 'background 0.2s ease',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: s.text,
              position: 'absolute',
              top: 2,
              left: enabled ? 20 : 2,
              transition: 'left 0.2s ease',
            }}
          />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: enabled ? plugin.color : s.text3, fontFamily: s.mono }}>
            {plugin.name}
          </div>
          <div style={{ fontSize: 11, color: s.text3, marginTop: 1 }}>{plugin.description}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {plugin.skills.length > 0 && (
          <span style={{ fontSize: 10, color: enabled ? plugin.color : s.text3, fontFamily: s.mono, background: enabled ? `${plugin.color}15` : 'transparent', padding: '2px 6px', borderRadius: 4 }}>
            {availableSkills.length}/{plugin.skills.length} skills
          </span>
        )}
        {plugin.hooks.length > 0 && (
          <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>
            {plugin.hooks.length} hooks
          </span>
        )}
        {plugin.mcpServers.length > 0 && (
          <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>
            {plugin.mcpServers.length} MCP servers
          </span>
        )}
        {plugin.commands.length > 0 && (
          <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>
            {plugin.commands.length} commands
          </span>
        )}
      </div>
      {enabled && plugin.skills.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
          {plugin.skills.map((sk) => (
            <span
              key={sk}
              style={{
                fontSize: 10,
                fontFamily: s.mono,
                color: activeSkills.has(sk) ? s.text : s.text3,
                background: activeSkills.has(sk) ? `${plugin.color}20` : s.bg3,
                padding: '2px 7px',
                borderRadius: 4,
                textDecoration: activeSkills.has(sk) ? 'none' : 'line-through',
              }}
            >
              {sk}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function SkillDetail({ skill }: { skill: Skill }) {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${s.accent}20`,
          border: `1px solid ${s.accent}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: s.mono,
          fontSize: 14,
          fontWeight: 700,
          color: s.accent,
        }}>
          {skill.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: s.text, fontFamily: s.mono }}>{skill.name}</div>
          <div style={{ fontSize: 12, color: s.text3 }}>{skill.model}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6, marginBottom: 20 }}>{skill.description}</div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
          When to use
        </div>
        <div style={{
          fontSize: 13,
          color: s.text2,
          lineHeight: 1.5,
          background: s.bg3,
          padding: '10px 14px',
          borderRadius: 8,
          borderLeft: `3px solid ${s.accent}`,
        }}>
          {skill.whenToUse}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
          Allowed tools ({skill.allowedTools.length})
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {skill.allowedTools.map((tool) => (
            <span
              key={tool}
              style={{
                fontSize: 12,
                fontFamily: s.mono,
                color: s.green,
                background: `${s.green}15`,
                padding: '4px 10px',
                borderRadius: 6,
                border: `1px solid ${s.green}30`,
              }}
            >
              {tool}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function CapabilitiesSummary({
  activeSkills,
  pluginList,
  pluginStates,
}: {
  activeSkills: Set<string>
  pluginList: Plugin[]
  pluginStates: Record<string, boolean>
}) {
  const activePlugins = Object.values(pluginStates).filter(Boolean).length
  const totalHooks = pluginList.reduce((sum, pl) => {
    return pluginStates[pl.name] ? sum + pl.hooks.length : sum
  }, 0)
  const totalMcp = pluginList.reduce((sum, pl) => {
    return pluginStates[pl.name] ? sum + pl.mcpServers.length : sum
  }, 0)
  const totalCommands = pluginList.reduce((sum, pl) => {
    return pluginStates[pl.name] ? sum + pl.commands.length : sum
  }, 0)
  const allTools = new Set<string>()
  activeSkills.forEach((sk) => {
    const skillData = skills[sk]
    if (skillData) skillData.allowedTools.forEach((t) => allTools.add(t))
  })

  return (
    <div style={{
      background: s.bg2,
      border: `1px solid ${s.border}`,
      borderRadius: 10,
      padding: '14px 18px',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
        Available capabilities
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Plugins', value: activePlugins, total: pluginList.length, color: s.accent },
          { label: 'Skills', value: activeSkills.size, total: Object.keys(skills).length, color: s.green },
          { label: 'Hooks', value: totalHooks, total: pluginList.reduce((a, pl) => a + pl.hooks.length, 0), color: s.yellow },
          { label: 'MCP servers', value: totalMcp, total: pluginList.reduce((a, pl) => a + pl.mcpServers.length, 0), color: s.purple },
          { label: 'Commands', value: totalCommands, total: pluginList.reduce((a, pl) => a + pl.commands.length, 0), color: s.orange },
          { label: 'Tool types', value: allTools.size, total: 7, color: s.red },
        ].map((stat) => (
          <div key={stat.label}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: stat.color, fontFamily: s.mono }}>{stat.value}</span>
              <span style={{ fontSize: 12, color: s.text3, fontFamily: s.mono }}>/ {stat.total}</span>
            </div>
            <div style={{ fontSize: 11, color: s.text3 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PluginSkillDemo() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [pluginStates, setPluginStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    plugins.forEach((pl) => { initial[pl.name] = true })
    return initial
  })

  const togglePlugin = (name: string) => {
    setPluginStates((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const activeSkills = new Set<string>()
  plugins.forEach((pl) => {
    if (pluginStates[pl.name]) {
      pl.skills.forEach((sk) => {
        if (skills[sk]) activeSkills.add(sk)
      })
    }
  })

  const skillEntries = Object.entries(skills)
  const selectedSkillData = selectedSkill ? skills[selectedSkill] : null

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <CapabilitiesSummary activeSkills={activeSkills} pluginList={plugins} pluginStates={pluginStates} />

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
          Plugins
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {plugins.map((pl) => (
            <PluginCard
              key={pl.name}
              plugin={pl}
              enabled={!!pluginStates[pl.name]}
              onToggle={() => togglePlugin(pl.name)}
              activeSkills={activeSkills}
            />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
          Bundled skills ({activeSkills.size} available)
        </div>
        <div style={{ display: 'flex', gap: 16, minHeight: 320 }}>
          <div style={{
            width: 220,
            flexShrink: 0,
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {skillEntries.map(([key, sk]) => {
                const isActive = activeSkills.has(key)
                const isSelected = selectedSkill === key
                return (
                  <button
                    key={key}
                    onClick={() => isActive && setSelectedSkill(key)}
                    disabled={!isActive}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '9px 14px',
                      border: 'none',
                      borderBottom: `1px solid ${s.border}`,
                      background: isSelected ? `${s.accent}15` : 'transparent',
                      cursor: isActive ? 'pointer' : 'default',
                      opacity: isActive ? 1 : 0.3,
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (isActive && !isSelected) e.currentTarget.style.background = s.bg3 }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isActive ? s.green : s.bg3,
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 13,
                      fontFamily: s.mono,
                      color: isSelected ? s.accent : isActive ? s.text : s.text3,
                      fontWeight: isSelected ? 600 : 400,
                    }}>
                      {key}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{
            flex: 1,
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 10,
            padding: selectedSkillData ? 20 : 0,
            display: 'flex',
            alignItems: selectedSkillData ? 'flex-start' : 'center',
            justifyContent: 'center',
            overflow: 'auto',
            maxHeight: 320,
          }}>
            {selectedSkillData ? (
              <SkillDetail skill={selectedSkillData} />
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{
                  fontSize: 32,
                  fontFamily: s.mono,
                  color: s.bg3,
                  marginBottom: 8,
                  lineHeight: 1,
                }}>
                  {'{ }'}
                </div>
                <div style={{ fontSize: 13, color: s.text3 }}>
                  Select a skill to inspect its properties
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const WrappedDemo = () => (
  <DemoBoundary name="Plugins and Skills">
    <PluginSkillDemo />
  </DemoBoundary>
)

export { WrappedDemo as default }
