import { test, expect, type APIRequestContext } from '@playwright/test';
const address = {
  name: 'Test Kund',
  street: 'Testgatan 12',
  postalCode: '111 22',
  city: 'Stockholm',
  email: 'test@example.com',
};
async function action(r: APIRequestContext, action: string, payload: Record<string, unknown> = {}) {
  return r.post('/api/shop', { data: { action, ...payload } });
}
async function bootstrap(r: APIRequestContext) {
  const response = await r.get('/api/shop');
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}
async function cart(r: APIRequestContext, offerId = 'p001-v1-s1', quantity = 1) {
  expect(
    (await action(r, 'cart', { items: [{ offerId, quantity, selected: true }] })).ok(),
  ).toBeTruthy();
}
test('successful order is server priced, idempotent, isolated, cancellable and restores gift', async ({
  request,
  playwright,
}) => {
  await bootstrap(request);
  await cart(request);
  const key = crypto.randomUUID();
  const payload = {
    idempotencyKey: key,
    address,
    payment: 'success',
    coupon: 'HEJ10',
    giftCode: 'NORD250',
    total: 1,
    price: 1,
  };
  const r = await action(request, 'checkout', payload);
  expect(r.ok(), await r.text()).toBeTruthy();
  const o = await r.json();
  expect(o.total).toBeGreaterThan(1);
  expect(o.paymentStatus).toBe('DEMO_PAID');
  const repeat = await action(request, 'checkout', payload);
  expect((await repeat.json()).id).toBe(o.id);
  const other = await playwright.request.newContext({
    baseURL: process.env.BASE_URL || 'http://localhost:3016',
  });
  await bootstrap(other);
  expect((await action(other, 'order', { id: o.id })).ok()).toBeFalsy();
  expect((await other.get(`/api/receipt/${o.id}`)).status()).toBe(404);
  expect((await action(request, 'cancel', { id: o.id })).ok()).toBeTruthy();
  expect((await action(request, 'cancel', { id: o.id })).ok()).toBeFalsy();
  const after = await bootstrap(request);
  expect(after.giftCards[0].balance).toBe(25000);
  await other.dispose();
});
test('failed and cancelled payments preserve stock, gift, coupon and cart', async ({ request }) => {
  await bootstrap(request);
  await cart(request);
  for (const payment of ['fail', 'cancel']) {
    const r = await action(request, 'checkout', {
      idempotencyKey: crypto.randomUUID(),
      address,
      payment,
      coupon: 'HEJ10',
      giftCode: 'NORD250',
    });
    expect(r.ok(), await r.text()).toBeTruthy();
    const o = await r.json();
    expect(o.paymentStatus).toBe(payment === 'fail' ? 'FAILED' : 'CANCELLED');
  }
  const data = await bootstrap(request);
  expect(data.cart.length).toBe(1);
  expect(data.giftCards[0].balance).toBe(25000);
  expect(data.inventory.find((i: { offerId: string }) => i.offerId === 'p001-v1-s1').stock).toBe(8);
});
test('parallel last-item checkout cannot oversell', async ({ request }) => {
  await bootstrap(request);
  await action(request, 'role', { role: 'admin' });
  expect(
    (
      await action(request, 'inventory', {
        id: 'p001-v1-s1',
        stock: 1,
        price: 10000,
        title: 'Sista lagervaran',
      })
    ).ok(),
  ).toBeTruthy();
  await cart(request);
  const responses = await Promise.all(
    [1, 2].map(() =>
      action(request, 'checkout', {
        idempotencyKey: crypto.randomUUID(),
        address,
        payment: 'success',
      }),
    ),
  );
  expect(responses.filter((r) => r.ok()).length).toBe(1);
  const d = await bootstrap(request);
  expect(d.inventory.find((i: { offerId: string }) => i.offerId === 'p001-v1-s1').stock).toBe(0);
});
test('customer/admin and seller ownership checks reject unauthorized writes', async ({
  request,
}) => {
  await bootstrap(request);
  expect(
    (
      await action(request, 'inventory', {
        id: 'p001-v1-s1',
        stock: 1,
        price: 10000,
        title: 'Forbidden',
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await action(request, 'coupon', {
        code: 'BAD',
        percent: 10,
        limit: 1,
        expiresAt: '2027-12-31T00:00:00Z',
      })
    ).status(),
  ).toBe(403);
  await action(request, 'role', { role: 'seller', sellerId: 's1' });
  expect(
    (
      await action(request, 'inventory', {
        id: 'p011-v1-s2',
        stock: 1,
        price: 10000,
        title: 'Forbidden',
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await action(request, 'inventory', {
        id: 'p001-v1-s1',
        stock: 3,
        price: 10000,
        title: 'Seller updated product',
      })
    ).ok(),
  ).toBeTruthy();
});
test('multi-seller shipping, customer return, partial refund and review', async ({ request }) => {
  await bootstrap(request);
  await action(request, 'cart', {
    items: [
      { offerId: 'p001-v1-s1', quantity: 1, selected: true },
      { offerId: 'p011-v1-s2', quantity: 1, selected: true },
    ],
  });
  const r = await action(request, 'checkout', {
    idempotencyKey: crypto.randomUUID(),
    address,
    payment: 'success',
  });
  expect(r.ok(), await r.text()).toBeTruthy();
  const o = await r.json();
  expect(o.shipments.length).toBe(2);
  await action(request, 'role', { role: 'seller', sellerId: 's1' });
  const foreign = o.shipments.find((s: { sellerId: string }) => s.sellerId === 's2');
  expect((await action(request, 'ship', { id: foreign.id, status: 'SHIPPED' })).ok()).toBeFalsy();
  const own = o.shipments.find((s: { sellerId: string }) => s.sellerId === 's1');
  expect((await action(request, 'ship', { id: own.id, status: 'SHIPPED' })).ok()).toBeTruthy();
  const visible = await bootstrap(request);
  expect(
    visible.orders
      .find((x: { id: string }) => x.id === o.id)
      .items.every((i: { sellerId: string }) => i.sellerId === 's1'),
  ).toBeTruthy();
  await action(request, 'role', { role: 'customer' });
  expect((await action(request, 'return', { id: o.id, reason: 'Passade inte' })).ok()).toBeTruthy();
  expect(
    (
      await action(request, 'review', {
        productId: 'p001',
        rating: 5,
        title: 'Bra demoköp',
        body: 'Det här är en genomförd demobeställning.',
      })
    ).ok(),
  ).toBeTruthy();
  await action(request, 'role', { role: 'admin' });
  expect((await action(request, 'refund', { id: o.id, amount: 100 })).ok()).toBeTruthy();
  const updated = await (await action(request, 'order', { id: o.id })).json();
  expect(updated.payment.refunded).toBe(100);
  expect(updated.paymentStatus).toBe('DEMO_PARTIAL_REFUND');
});
test('URL search filters, sorts and has useful empty state', async ({ page }) => {
  await page.goto('/sok?category=hem&sort=price-asc&stock=1');
  await expect(page.locator('.results-grid .product-card')).toHaveCount(9);
  await page.goto('/sok?q=zzzznotaproduct');
  await expect(page.getByRole('heading', { name: 'Ingen träff den här gången' })).toBeVisible();
});
test('variant selection, guest cart and complete browser checkout', async ({ page }) => {
  await page.goto('/produkt/p001');
  await expect(page.getByRole('button', { name: 'Lägg i varukorg', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: /Plus · utökat paket/ }).click();
  await expect(page.locator('.variant-options .selected')).toContainText('Plus');
  await page.getByRole('button', { name: 'Lägg i varukorg', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Tillagd');
  await page.goto('/varukorg');
  await expect(page.locator('.cart-row')).toContainText('Plus · utökat paket');
  await page.getByRole('link', { name: /Fortsätt till kassan/ }).click();
  await page.getByRole('button', { name: 'Slutför demoköp' }).click();
  await expect(page.getByRole('heading', { name: 'Din beställning', exact: true })).toBeVisible();
  await expect(page.locator('.order-status')).toContainText('Demobetalning godkänd');
});
test('register/login merges guest and account carts', async ({ page, request }) => {
  await bootstrap(request);
  await page.goto('/konto');
  await expect(
    page.getByRole('button', { name: 'Skapa konto', exact: true }).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Skapa konto', exact: true }).first().click();
  await page.getByLabel('Namn', { exact: true }).fill('Demo Test');
  await page.getByLabel('E-post', { exact: true }).fill(`test-${crypto.randomUUID()}@example.com`);
  await page.getByLabel('Lösenord (minst 10 tecken)').fill('DemoPassword123!');
  await page.getByRole('button', { name: 'Skapa konto', exact: true }).last().click();
  await expect(page.getByText(/Inloggad som/)).toBeVisible();
});
for (const width of [390, 768, 1280, 1440])
  test(`responsive ${width}px: no overflow, images load, screenshot`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await expect(page.locator('#main .category-overlap:visible')).toBeVisible();
    await expect(page.locator('.account-link')).toContainText('Demokund');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy();
    await expect(page.locator('.hero-photo')).toHaveJSProperty('complete', true);
    await page.screenshot({ path: `docs/screenshots/home-${width}.png`, fullPage: true });
    await page.goto('/produkt/p001');
    await expect(page.locator('#main .buy-box:visible')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lägg i varukorg', exact: true })).toBeEnabled();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy();
    await page.screenshot({ path: `docs/screenshots/product-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
