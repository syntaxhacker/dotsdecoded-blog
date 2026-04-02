import { test, expect } from '@playwright/test'

test.describe('Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('home page renders on mobile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('site-title')).toBeVisible()
    await expect(page.getByTestId('search-input')).toBeVisible()
    const cards = page.getByTestId('blog-card')
    await expect(cards).toHaveCount(7)
  })

  test('blog post page renders on mobile', async ({ page }) => {
    await page.goto('/blog/database-internals', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('post-title')).toBeVisible()
    await expect(page.getByTestId('post-content')).toBeVisible()
    await expect(page.getByTestId('back-link')).toBeVisible()
  })

  test('404 page renders on mobile', async ({ page }) => {
    await page.goto('/nonexistent', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('not-found-title')).toBeVisible()
    await expect(page.getByTestId('back-home-link')).toBeVisible()
  })

  test('theme toggle works on mobile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const html = page.getByTestId('html-root')
    const initial = await html.getAttribute('data-theme')
    await page.getByTestId('theme-toggle').click()
    expect(await html.getAttribute('data-theme')).not.toBe(initial)
  })
})
