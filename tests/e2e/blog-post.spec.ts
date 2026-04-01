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

test.describe('Blog Post Pages', () => {
  for (const slug of POST_SLUGS) {
    test(`${slug} - renders correctly with title, meta, tags, TOC, OG`, async ({ page }) => {
      await page.goto(`/blog/${slug}`, { waitUntil: 'domcontentloaded' })

      await expect(page.getByTestId('post-title')).toBeVisible()
      await expect(page.getByTestId('post-content')).toBeVisible()
      await expect(page.getByTestId('post-meta')).toBeVisible()
      await expect(page.getByTestId('post-meta').locator('time')).toBeVisible()

      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1)
      await expect(page.locator('meta[property="og:description"]')).toHaveCount(1)
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)
      await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1)
      await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(1)
      await expect(page.locator('[data-testid="canonical-link"]')).toHaveCount(1)

      const title = await page.locator('[data-testid="page-title"]').textContent()
      expect(title).toContain('DotsDecoded')
      expect(title).toContain('—')

      const canonical = await page.locator('[data-testid="canonical-link"]').getAttribute('href')
      expect(canonical).toContain(`/blog/${slug}`)

      const tocNav = page.getByTestId('toc-nav')
      await expect(tocNav).toBeVisible()
      const tocLinks = page.locator('[data-testid="toc-link"]')
      const linkCount = await tocLinks.count()
      expect(linkCount).toBeGreaterThan(0)

      for (let i = 0; i < linkCount; i++) {
        const href = await tocLinks.nth(i).getAttribute('href')
        expect(href).toBeTruthy()
        expect(href).toMatch(/^#[a-z0-9-]+$/)
      }

      const postTags = page.locator('[data-testid="post-tag"]')
      expect(await postTags.count()).toBeGreaterThan(0)
    })
  }

  test('first post back link navigates to home', async ({ page }) => {
    await page.goto(`/blog/${POST_SLUGS[0]}`, { waitUntil: 'domcontentloaded' })
    await Promise.all([
      page.waitForURL('/'),
      page.getByTestId('back-link').click(),
    ])
    await expect(page.getByTestId('site-title')).toBeVisible()
  })
})
