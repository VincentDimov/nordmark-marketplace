export type Rules = {
  freeShippingThreshold: number;
  standardShipping: number;
  expressShipping: number;
  taxPercent: number;
};
export function shopRules(settings: Record<string, unknown> = {}): Rules {
  return {
    freeShippingThreshold: Number(settings.freeShippingThreshold ?? 49900),
    standardShipping: Number(settings.standardShipping ?? 4900),
    expressShipping: Number(settings.expressShipping ?? 3900),
    taxPercent: Number(settings.taxPercent ?? 25),
  };
}
export function totals(
  subtotal: number,
  percent = 0,
  gift = 0,
  express = false,
  member = false,
  rules: Rules = shopRules(),
) {
  const discount = Math.round((subtotal * percent) / 100);
  const shipping = member || subtotal >= rules.freeShippingThreshold ? 0 : rules.standardShipping;
  const delivery = shipping + (express ? rules.expressShipping : 0);
  const beforeGift = subtotal - discount + delivery;
  const giftAmount = Math.min(gift, beforeGift);
  return {
    subtotal,
    discount,
    shipping: delivery,
    giftAmount,
    tax: Math.round((beforeGift * rules.taxPercent) / (100 + rules.taxPercent)),
    total: beforeGift - giftAmount,
  };
}
