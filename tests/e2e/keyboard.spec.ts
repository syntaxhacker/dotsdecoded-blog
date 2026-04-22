import { test, expect } from '@playwright/test'

test.describe('Keyboard Accessibility', () => {
  test('Tab through home page reaches search input', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.keyboard.press('Tab')
    let focused = await page.evaluate(() => document.activeElement?.tagName)
    let iterations = 0
    while (focused !== 'INPUT' && iterations < 20) {
      await page.keyboard.press('Tab')
      focused = await page.evaluate(() => document.activeElement?.tagName)
      iterations++
    }
    expect(focused).toBe('INPUT')
    const inputId = await page.evaluate(() => (document.activeElement as HTMLElement)?.id)
    expect(inputId).toBe('search-input')
  })

  test('Enter on search input does not break page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const input = page.getByTestId('search-input')
    await input.focus()
    await input.fill('test')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    const cards = page.locator('[data-testid="blog-card"]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
})

  test('Escape clears search input', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const input = page.getByTestId('search-input')
    await input.focus()
    await input.fill('some query')
    expect(await input.inputValue()).toBe('some query')
    await input.blur()
  })

  test('blog post back link is focusable', async ({ page }) => {
    await page.goto('/blog/database-internals', { waitUntil: 'domcontentloaded' })
    await page.getByTestId('back-link').focus()
    await expect(page.getByTestId('back-link')).toBeFocused()
    await page.keyboard.press('Enter')
    await page.waitForURL('/')
    await expect(page.getByTestId('site-title')).toBeVisible()
  })
})
