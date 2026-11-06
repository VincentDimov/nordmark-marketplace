import { test, expect } from '@playwright/test';
test('admin product change is searchable and visible; seller portal renders own inventory', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Öppna adminpanelen' }).click();
  await expect(page.locator('.portal-main h1')).toHaveText('Översikt');
  await page.locator('.portal-sidebar').getByRole('button', { name: 'Produkter & lager' }).click();
  await page.getByLabel('Sök i produktkatalogen').fill('Apple MacBook');
  await page.getByRole('button', { name: 'Redigera', exact: true }).first().click();
  await page.getByLabel('Produktnamn', { exact: true }).fill('Nordmark Testdator – uppdaterad');
  await page.getByLabel('Pris i kronor', { exact: true }).fill('1999');
  await page.getByLabel('Lagersaldo', { exact: true }).fill('4');
  await page.getByRole('button', { name: 'Spara', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('uppdaterad');
  await page.goto('/sok?q=Nordmark%20Testdator');
  await expect(page.locator('.results-grid .product-card')).toHaveCount(1);
  await expect(page.locator('.product-title')).toContainText('Nordmark Testdator');
  await page.goto('/admin');
  await expect(page.locator('.portal-main h1')).toHaveText('Översikt');
  await page.screenshot({ path: 'docs/screenshots/admin-1280.png', fullPage: true });
  await page.goto('/portal');
  await page.getByRole('button', { name: 'Öppna säljarportalen' }).click();
  await page.locator('.portal-sidebar').getByRole('button', { name: 'Produkter & lager' }).click();
  await expect(page.locator('.portal-main table tbody tr').first()).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/seller-1280.png', fullPage: true });
  expect(errors).toEqual([]);
});
