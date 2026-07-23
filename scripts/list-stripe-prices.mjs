// Liste tout pri yo pou pwodwi Hoïs yo, ak ID `price_...` yo.
//
// Li kle a nan .env.local — kle a pa janm afiche, li pa janm kite machin ou.
//
//   node scripts/list-stripe-prices.mjs
//
// Rezilta a se sa nou bezwen pou ranpli subscription_plans.stripe_price_id_*.

import fs from 'node:fs';
import Stripe from 'stripe';

function readEnvLocal(name) {
  try {
    const raw = fs.readFileSync('.env.local', 'utf8');
    const line = raw
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : null;
  } catch {
    return null;
  }
}

const key = process.env.STRIPE_SECRET_KEY || readEnvLocal('STRIPE_SECRET_KEY');
if (!key) {
  console.error(
    'STRIPE_SECRET_KEY pa jwenn. Mete l nan .env.local:\n' +
      '  echo "STRIPE_SECRET_KEY=sk_test_XXXX" >> .env.local'
  );
  process.exit(1);
}

const stripe = new Stripe(key);
const mode = key.startsWith('sk_live_') ? 'LIVE' : 'TEST';

const products = await stripe.products.list({ limit: 100, active: true });
const prices = await stripe.prices.list({ limit: 100, active: true });

console.log(`\nMòd: ${mode}\n`);

const hois = products.data.filter((p) => /ho[ïi]s/i.test(p.name));
if (hois.length === 0) {
  console.log('Okenn pwodwi "Hoïs" jwenn nan mòd sa a.');
  console.log('Sonje: pwodwi Test yo pa egziste an Live, e vice versa.');
}

for (const product of hois) {
  console.log(`── ${product.name}  (${product.id})`);
  const mine = prices.data.filter((pr) => pr.product === product.id);
  if (mine.length === 0) {
    console.log('   ⚠️  PA GEN PRI — fòk ou ajoute yon pri Monthly ak yon Yearly.');
  }
  for (const pr of mine) {
    const amount =
      pr.unit_amount != null ? `$${(pr.unit_amount / 100).toFixed(2)}` : '(varyab)';
    const interval = pr.recurring
      ? `chak ${pr.recurring.interval === 'year' ? 'ane' : 'mwa'}`
      : '⚠️ YON SÈL FWA (fòk li Recurring)';
    console.log(`   ${pr.id}   ${amount}  ${interval}  [${pr.currency.toUpperCase()}]`);
  }
  console.log('');
}
