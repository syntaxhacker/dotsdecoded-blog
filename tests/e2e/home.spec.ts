import { test, expect } from '@playwright/test'

const POST_SLUGS = [
  'database-internals',
  'how-claude-code-works',
  'ip-addresses-explained',
  'libuv-nodejs-under-the-hood',
  'server-sent-events-explained',
  'sql-vs-nosql',
  'ssh-keys-auth',
]

test.describe('Home Page', () => {
  test('loads with correct structure, posts, and meta', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('site-title')).toHaveText('Dots_Decoded')
    await expect(page.getByTestId('subtitle')).toBeVisible()
    expect(await page.title()).toContain('DotsDecoded')
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1)
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1)
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
    await expect(page.locator('[data-testid="canonical-link"]')).toHaveCount(1)

    const cards = page.getByTestId('blog-card')
    await expect(cards).toHaveCount(POST_SLUGS.length)

    const count = await cards.count()
    const slugs: string[] = []
    for (let i = 0; i < count; i++) {
      const slug = await cards.nth(i).getAttribute('data-post-slug')
      if (slug) slugs.push(slug)
      await expect(cards.nth(i).locator('.blog-card-title')).toBeVisible()
      await expect(cards.nth(i).locator('time')).toBeVisible()
      await expect(cards.nth(i).locator('.blog-card-desc')).toBeVisible()
      expect(await cards.nth(i).locator('[data-testid="tag"]').count()).toBeGreaterThan(0)
      const href = await cards.nth(i).getAttribute('href')
      expect(href).toMatch(/^\/blog\/[a-z0-9-]+$/)
    }
    for (const slug of POST_SLUGS) {
      expect(slugs).toContain(slug)
    }
  })

  test('search filters posts by title', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const input = page.getByTestId('search-input')
    await input.fill('server')
    await page.waitForTimeout(200)
    const cards = page.locator('[data-testid="blog-card"]')
    let shown = 0
    for (let i = 0; i < await cards.count(); i++) {
      const style = await cards.nth(i).getAttribute('style')
      if (style?.includes('display: none') || style?.includes('display:none')) continue
      shown++
    }
    expect(shown).toBeLessThan(POST_SLUGS.length)
    expect(shown).toBeGreaterThan(0)
  })

  test('search restores all posts when cleared', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const input = page.getByTestId('search-input')
    await input.fill('nonexistent-xyz')
    await page.waitForTimeout(200)
    await input.clear()
    await page.waitForTimeout(100)
    const cards = page.locator('[data-testid="blog-card"]')
    let shown = 0
    for (let i = 0; i < await cards.count(); i++) {
      const style = await cards.nth(i).getAttribute('style')
      if (style?.includes('display: none') || style?.includes('display:none')) continue
      shown++
    }
    expect(shown).toBe(POST_SLUGS.length)
  })

  test('search filters by tag', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const input = page.getByTestId('search-input')
    await input.fill('sql')
    await page.waitForTimeout(200)
    const cards = page.locator('[data-testid="blog-card"]')
    let shown = 0
    for (let i = 0; i < await cards.count(); i++) {
      const style = await cards.nth(i).getAttribute('style')
      if (style?.includes('display: none') || style?.includes('display:none')) continue
      const tags = await cards.nth(i).getAttribute('data-tags') || ''
      expect(tags).toContain('sql')
      shown++
    }
    expect(shown).toBeGreaterThan(0)
  })

  test('theme toggle switches data-theme', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const html = page.getByTestId('html-root')
    const initial = await html.getAttribute('data-theme')
    await page.getByTestId('theme-toggle').click()
    expect(await html.getAttribute('data-theme')).not.toBe(initial)
    await page.getByTestId('theme-toggle').click()
    expect(await html.getAttribute('data-theme')).toBe(initial)
  })

  test('tag graph canvas renders', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const wrapper = page.getByTestId('tag-graph-wrapper')
    await expect(wrapper).toBeVisible()
    await expect(wrapper.locator('canvas')).toBeVisible()
  })
})
