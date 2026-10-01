import { test, expect } from '@playwright/test';

const titles = ['Web讀寫卡系統', 'LineBot', 'BinanceTrade', 'RagLearning問答機器人', '高雄菜價快查', 'openAlice', 'Azure DevOps 平台運用', 'TPM 防竄改監控系統'];

async function openJourney(page, { requireCanvas = true } = {}) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#loading')).toBeHidden({ timeout: 30_000 });
  await expect(page.locator('#fallback')).toBeHidden();
  if (requireCanvas) await expect(page.locator('#render-surface canvas')).toBeVisible();
  await expect(page.locator('#work-list .work-row')).toHaveCount(titles.length);
}

async function enterFeatured(page) {
  await page.locator('#enter-gallery').click();
  await expect(page.locator('#featured-view')).toHaveAttribute('aria-hidden', 'false');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await settleScroll(page);
}

async function openFreeMode(page) {
  await enterFeatured(page);
  const scrollPosition = await page.evaluate(() => scrollY);
  await page.locator('#free-mode').click();
  await expect(page.locator('body')).toHaveClass(/is-free/);
  await expect(page.locator('#free-panel')).toBeVisible();
  await expect(page.locator('#zoom-level')).toHaveText('100%');
  return scrollPosition;
}

async function settleScroll(page) {
  await page.evaluate(() => new Promise((resolve) => {
    let previous = scrollY, stableFrames = 0;
    function check() {
      const current = scrollY;
      stableFrames = Math.abs(current - previous) < .5 ? stableFrames + 1 : 0;
      previous = current;
      if (stableFrames >= 8) resolve();
      else requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
  }));
}

async function freeCenter(page) {
  const bounds = await page.locator('#free-gallery-area').boundingBox();
  expect(bounds).not.toBeNull();
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

async function zoomValue(page) {
  return Number.parseInt(await page.locator('#zoom-level').textContent(), 10);
}

async function assertScrollRestored(page, scrollPosition) {
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - scrollPosition)).toBeLessThan(3);
}

test('the scroll journey reaches the selected work, whose details return to the same view', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openJourney(page);
  await page.screenshot({ path: testInfo.outputPath('cinematic-landing.png') });
  await enterFeatured(page);
  const first = Number.parseInt(await page.locator('#featured-count').textContent(), 10);
  await page.locator('#next-work').click();
  const next = first % titles.length + 1;
  await expect(page.locator('#featured-count')).toHaveText(new RegExp(`0${next}\\s*/\\s*08`));
  await settleScroll(page);
  await page.locator('#prev-work').click();
  await expect(page.locator('#featured-count')).toHaveText(new RegExp(`0${first}\\s*/\\s*08`));
  await settleScroll(page);
  await page.locator('#next-work').click();
  await expect(page.locator('#featured-count')).toHaveText(new RegExp(`0${next}\\s*/\\s*08`));
  await settleScroll(page);
  await page.screenshot({ path: testInfo.outputPath('cinematic-featured.png') });
  const scrollPosition = await page.evaluate(() => scrollY);
  await page.locator('#open-featured').click();
  await expect(page.locator('#work-dialog')).toBeVisible();
  await expect(page.locator('#work-title')).toHaveText(titles[next - 1]);
  await expect(page.locator('#work-description')).not.toBeEmpty();
  await page.keyboard.press('Escape');
  await expect(page.locator('#work-dialog')).toBeHidden();
  await assertScrollRestored(page, scrollPosition);
  await expect(page.locator('#open-featured')).toBeFocused();
  expect(errors).toEqual([]);
});

test('the complete HTML collection opens the last work and restores the invoking row', async ({ page }, testInfo) => {
  await openJourney(page);
  const row = page.locator('#work-list .work-row').last();
  await row.scrollIntoViewIfNeeded();
  const scrollPosition = await page.evaluate(() => scrollY);
  await row.click();
  await expect(page.locator('#work-dialog')).toBeVisible();
  await expect(page.locator('#work-title')).toHaveText('TPM 防竄改監控系統');
  await expect(page.locator('#work-number')).toHaveText('08 / 08');
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('collection-work.png') });
  await page.locator('#close-work').click();
  await expect(page.locator('#work-dialog')).toBeHidden();
  await assertScrollRestored(page, scrollPosition);
  await expect(row).toBeFocused();
});

test('free exploration pans without selecting, then opens a work and preserves zoom on return', async ({ page }) => {
  await openJourney(page);
  const scrollPosition = await openFreeMode(page);
  const center = await freeCenter(page);
  for (let drag = 0; drag < 3; drag++) {
    await page.mouse.move(center.x + 140, center.y);
    await page.mouse.down();
    await page.mouse.move(center.x - 140, center.y + 35, { steps: 12 });
    await page.mouse.up();
  }
  await expect(page.locator('#work-dialog')).toBeHidden();
  await expect(page.locator('#free-gallery-area')).not.toHaveClass(/is-dragging/);
  await page.locator('#reset-view').click();
  // Allow the damped camera to finish returning from the drag before raycasting.
  await page.waitForTimeout(800);
  await page.locator('#zoom-in').click();
  await expect(page.locator('#zoom-level')).toHaveText('122%');
  const zoom = await page.locator('#zoom-level').textContent();
  await page.mouse.click(center.x, center.y);
  await expect(page.locator('#work-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#work-dialog')).toBeHidden();
  await expect(page.locator('body')).toHaveClass(/is-free/);
  await expect(page.locator('#zoom-level')).toHaveText(zoom);
  await page.locator('#exit-free').click();
  await expect(page.locator('body')).not.toHaveClass(/is-free/);
  await expect(page.locator('#free-panel')).toBeHidden();
  await expect(page.locator('#open-featured')).toBeVisible();
  await assertScrollRestored(page, scrollPosition);
});

test('free exploration wheel and keyboard zoom respect bounds and reset', async ({ page }) => {
  await openJourney(page);
  await openFreeMode(page);
  const center = await freeCenter(page);
  await page.mouse.move(center.x, center.y);
  const scrollPosition = await page.evaluate(() => scrollY);
  for (let i = 0; i < 16; i++) await page.mouse.wheel(0, -300);
  await expect(page.locator('#zoom-in')).toBeDisabled();
  await expect.poll(() => zoomValue(page)).toBeGreaterThan(100);
  for (let i = 0; i < 24; i++) await page.mouse.wheel(0, 300);
  await expect(page.locator('#zoom-out')).toBeDisabled();
  await expect.poll(() => zoomValue(page)).toBeLessThan(100);
  await assertScrollRestored(page, scrollPosition);
  await page.locator('#free-gallery-area').focus();
  await page.keyboard.press('Home');
  await expect(page.locator('#zoom-level')).toHaveText('100%');
  await page.keyboard.press('+');
  await expect.poll(() => zoomValue(page)).toBeGreaterThan(100);
  await page.keyboard.press('Home');
  await expect(page.locator('#zoom-level')).toHaveText('100%');
});

test.describe('mobile touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });

  test('pinch and swipe work in free exploration, and artwork details close accessibly', async ({ page }, testInfo) => {
    await openJourney(page);
    await page.screenshot({ path: testInfo.outputPath('mobile-landing.png') });
    await openFreeMode(page);
    const center = await freeCenter(page);
    const cdp = await page.context().newCDPSession(page);
    const point = (id, x, y) => ({ id, x, y, radiusX: 3, radiusY: 3, force: 1 });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(0, center.x - 35, center.y), point(1, center.x + 35, center.y)] });
    for (const spread of [45, 55, 65, 75]) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(0, center.x - spread, center.y), point(1, center.x + spread, center.y)] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => zoomValue(page)).toBeGreaterThan(100);
    await page.locator('#reset-view').tap();
    await expect(page.locator('#zoom-level')).toHaveText('100%');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(0, center.x + 65, center.y)] });
    for (const delta of [35, 0, -35, -65]) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(0, center.x + delta, center.y + 10)] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.locator('#work-dialog')).toBeHidden();
    await expect(page.locator('#free-gallery-area')).not.toHaveClass(/is-dragging/);
    // Separate the completed CDP swipe from the next touchscreen tap.
    await page.waitForTimeout(200);
    await page.locator('#reset-view').tap();
    await page.waitForTimeout(800);
    await page.screenshot({ path: testInfo.outputPath('mobile-free-gallery.png') });
    await page.touchscreen.tap(center.x, center.y);
    await expect(page.locator('#work-dialog')).toBeVisible();
    await expect(page.locator('#work-title')).toHaveText('Web讀寫卡系統');
    await expect(page.locator('#close-work')).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath('mobile-work.png') });
    await page.locator('#close-work').tap();
    await expect(page.locator('#work-dialog')).toBeHidden();
    await expect(page.locator('#zoom-level')).toHaveText('100%');
    await page.locator('#exit-free').tap();
    await expect(page.locator('body')).not.toHaveClass(/is-free/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await cdp.detach();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the collection and native dialogs work without the animated journey', async ({ page }) => {
    await openJourney(page, { requireCanvas: false });
    await expect(page.locator('body')).toHaveClass(/reduced-motion/);
    const row = page.locator('#work-list .work-row').nth(3);
    await row.click();
    await expect(page.locator('#work-dialog')).toBeVisible();
    await expect(page.locator('#work-title')).toHaveText('RagLearning問答機器人');
    await page.keyboard.press('Escape');
    await expect(page.locator('#work-dialog')).toBeHidden();
    await expect(row).toBeFocused();
    await page.locator('#work-list .work-row').first().click();
    await expect(page.locator('#work-title')).toHaveText('Web讀寫卡系統');
  });
});

test('without WebGL, the complete HTML collection and details remain accessible', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
      return getContext.call(this, kind, ...args);
    };
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#loading')).toBeHidden({ timeout: 30_000 });
  await expect(page.locator('#fallback')).toBeVisible();
  await expect(page.locator('#work-list .work-row')).toHaveCount(titles.length);
  const row = page.locator('#work-list .work-row').last();
  await row.click();
  await expect(page.locator('#work-dialog')).toBeVisible();
  await expect(page.locator('#work-title')).toHaveText('TPM 防竄改監控系統');
  await page.screenshot({ path: testInfo.outputPath('fallback-work.png') });
  await page.keyboard.press('Escape');
  await expect(page.locator('#work-dialog')).toBeHidden();
  await expect(row).toBeFocused();
});

test.describe('short landscape', () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });

  test('the journey has no horizontal overflow and artwork close control is reachable', async ({ page }, testInfo) => {
    await openJourney(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.locator('#work-list .work-row').first().click();
    await expect(page.locator('#work-dialog')).toBeVisible();
    await expect(page.locator('#close-work')).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath('landscape-work.png') });
    await page.locator('#close-work').tap();
    await expect(page.locator('#work-dialog')).toBeHidden();
  });
});
