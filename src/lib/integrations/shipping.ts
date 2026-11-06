export interface ShippingAdapter {
  quote(
    postcode: string,
    express: boolean,
  ): { days: string; additionalCost: number; simulated: boolean };
  track(id: string): { tracking: string; url: string | null; simulated: boolean };
}
export const demoShipping: ShippingAdapter = {
  quote: (postcode, express) => ({
    days: express
      ? '1–2 vardagar'
      : Number(postcode.replace(/\s/g, '')) >= 80000
        ? '3–5 vardagar'
        : '2–4 vardagar',
    additionalCost: express ? 3900 : 0,
    simulated: true,
  }),
  track: (id) => ({ tracking: `DEMO-${id.slice(-8).toUpperCase()}`, url: null, simulated: true }),
};
