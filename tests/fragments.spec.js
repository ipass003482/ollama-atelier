import { test, expect } from '@playwright/test';

test('fragments load, pause, and expose all portfolio details', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/fragments.html');
  await expect(page.locator('.work-chip')).toHaveCount(8);
  await page.waitForFunction(() => [...document.images].filter(image => image.hasAttribute('src')).every(image => image.complete && image.naturalWidth > 0));
  await page.getByRole('button', { name: '暫停掉落' }).click();
  await expect(page.locator('#pause')).toHaveAttribute('aria-pressed', 'true');
  const frozen = await page.locator('canvas').evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(150);
  expect(await page.locator('canvas').evaluate(canvas => canvas.toDataURL())).toBe(frozen);
  await page.getByRole('button', { name: '增加碎片' }).click();
  await page.waitForTimeout(100);
  expect(await page.locator('canvas').evaluate(canvas => canvas.toDataURL())).not.toBe(frozen);
  for (const chip of await page.locator('.work-chip').all()) {
    await chip.click();
    await expect(page.locator('#work-dialog')).toBeVisible();
    await expect(page.locator('#detail-title')).not.toBeEmpty();
    await page.keyboard.press('Escape');
    await expect(page.locator('#work-dialog')).not.toBeVisible();
  }
  await page.screenshot({ path: 'test-results/fragments-desktop.png' });
  expect(errors).toEqual([]);
});

test('mobile and reduced motion retain usable controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/fragments.html');
  await expect(page.locator('#pause')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: '查看TPM 防竄改監控系統' }).click();
  await expect(page.locator('#detail-title')).toHaveText('TPM 防竄改監控系統');
  await page.getByRole('button', { name: '關閉作品介紹' }).click();
  await expect(page.locator('#work-dialog')).not.toBeVisible();
  await page.screenshot({ path: 'test-results/fragments-mobile.png' });
});
