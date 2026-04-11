import { test } from '@playwright/test';
import path from 'path';
const dir = path.join(__dirname, 'screenshots');

test('캘린더 렌더링 상세 분석', async ({ page }) => {
  await page.goto('/test-datepicker');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /마감일 선택/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/01-open.png`, fullPage: true });

  const info = await page.evaluate(() => {
    const wrapper = document.querySelector('[data-radix-popper-content-wrapper]');
    const content = document.querySelector('[data-radix-popper-content-wrapper] > div');
    const calendar = document.querySelector('[data-slot="calendar"]');

    return {
      wrapper: wrapper ? {
        rect: wrapper.getBoundingClientRect(),
        style: (wrapper as HTMLElement).getAttribute('style'),
      } : null,
      content: content ? {
        rect: content.getBoundingClientRect(),
        computedMaxHeight: getComputedStyle(content).maxHeight,
        computedOverflow: getComputedStyle(content).overflow,
      } : null,
      calendar: calendar ? {
        rect: calendar.getBoundingClientRect(),
        computedCellSize: getComputedStyle(calendar).getPropertyValue('--cell-size'),
      } : null,
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  });

  console.log(JSON.stringify(info, null, 2));
});
