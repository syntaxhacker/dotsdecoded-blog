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

test.describe('404 Page', () => {
  test('shows not found content and back link works', async ({ page }) => {
    await page.goto('/this-page-does-not-exist', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('not-found-title')).toHaveText('404 - Not Found')
    await expect(page.getByTestId('not-found-title')).toBeVisible()
    await Promise.all([
      page.waitForURL('/'),
      page.getByTestId('back-home-link').click(),
    ])
    await expect(page.getByTestId('site-title')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('all blog post slugs return 200 and have post title', async ({ page }) => {
    for (const slug of POST_SLUGS) {
      const response = await page.goto(`/blog/${slug}`, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await expect(page.locator('[data-testid="post-title"]')).toBeVisible()
    }
  })

  test('navigating from home to first blog post works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const firstCard = page.locator('[data-testid="blog-card"]').first()
    const slug = await firstCard.getAttribute('data-post-slug')
    await Promise.all([
      page.waitForURL(`/blog/${slug}`),
      firstCard.click(),
    ])
    await expect(page.locator('[data-testid="post-title"]')).toBeVisible()
  })

  test('pagefind search index is available', async ({ page }) => {
    const response = await page.goto('/pagefind/pagefind.js', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
  })
})
