import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  products,
  categories,
  sellers,
  searchProducts,
  discount,
  findOffer,
} from '../src/lib/catalog';
import { totals } from '../src/lib/totals';
test('catalog contains required distinct entities', () => {
  assert.equal(products.length, 120);
  assert.equal(categories.length, 12);
  assert.equal(sellers.length, 5);
  assert.equal(new Set(products.map((p) => p.id)).size, 120);
  assert.ok(products.every((p) => p.variants.length === 2));
});
test('search checks title and brand, with stable price sorting', () => {
  const result = searchProducts({ q: 'Apple', sort: 'price-asc', stock: '1' });
  assert.ok(result.length > 0);
  assert.ok(result.every((p) => (p.title + ' ' + p.brand).toLowerCase().includes('apple')));
  for (let i = 1; i < result.length; i++)
    assert.ok(result[i].variants[0].offers[0].price >= result[i - 1].variants[0].offers[0].price);
  assert.equal(searchProducts({ q: 'zzzznotaproduct' }).length, 0);
  assert.equal(searchProducts({ category: 'hem' }).length, 10);
});
test('server filter intersects seller, rating, price and stock', () => {
  const result = searchProducts({ seller: 's1', rating: '4.5', max: '99999', stock: '1' });
  assert.ok(result.length);
  assert.ok(
    result.every(
      (p) =>
        p.rating >= 4.5 &&
        p.variants[0].offers[0].sellerId === 's1' &&
        p.variants[0].offers[0].stock > 0,
    ),
  );
});
test('integer amounts apply coupon, shipping, gift and included tax', () => {
  assert.deepEqual(totals(10000, 10, 2500), {
    subtotal: 10000,
    discount: 1000,
    shipping: 4900,
    giftAmount: 2500,
    tax: 2780,
    total: 11400,
  });
  assert.equal(totals(49900).shipping, 0);
  assert.equal(totals(10000, 0, 999999).total, 0);
  assert.equal(totals(10000, 0, 0, false, true).shipping, 0);
  assert.equal(totals(50000, 0, 0, true).shipping, 3900);
});
test('variant offer resolution never trusts unknown offer', () => {
  assert.equal(findOffer('invalid'), null);
  const p = products[0];
  assert.equal(findOffer(p.variants[1].offers[0].id)?.variant.name, p.variants[1].name);
  assert.notEqual(p.variants[0].offers[0].price, p.variants[1].offers[0].price);
  assert.equal(discount(7500, 10000), 25);
});
