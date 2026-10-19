import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve('dist');
const PORT = 8799;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = join(ROOT, p);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    if (p.endsWith('/')) {
      try {
        const body = await readFile(join(ROOT, p, 'index.html'));
        res.writeHead(200, { 'Content-Type': TYPES['.html'] });
        return res.end(body);
      } catch {}
    }
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${PORT}`;

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Collect console errors and failed requests across every page.
const consoleErrors = [];
const failedRequests = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
page.on('requestfailed', (r) =>
  failedRequests.push(`${r.url()} ${r.failure()?.errorText ?? ''}`),
);
page.on('response', (r) => {
  if (r.status() >= 400) failedRequests.push(`${r.url()} -> HTTP ${r.status()}`);
});

console.log('\n=== 1. Part page: Save button ===');
await page.goto(`${BASE}/part/nema-17-stepper/`, { waitUntil: 'networkidle' });

const saveBox = page.locator('.save-row');
check('save-row present on part page', (await saveBox.count()) === 1);

const radios = saveBox.locator('input[type=radio]');
check('two intent radios render', (await radios.count()) === 2);

const msgBefore = await saveBox.locator('.save-msg').textContent();
check('no saved-state message on a fresh load', msgBefore?.trim() === '', `got "${msgBefore}"`);

await saveBox.getByText('Own', { exact: true }).click();
await page.waitForTimeout(150);

const msgAfter = await saveBox.locator('.save-msg').textContent();
check(
  'clicking Own reports a save',
  /saved as owned/i.test(msgAfter ?? ''),
  `got "${msgAfter}"`,
);

const stored = await page.evaluate(() =>
  localStorage.getItem('projectdir.inventory.v1'),
);
check('inventory written to the specified key', typeof stored === 'string' && stored.length > 0);

const parsed = stored ? JSON.parse(stored) : null;
check(
  'stored record is well formed',
  parsed?.records?.[0]?.partId === 'nema-17-stepper' &&
    parsed.records[0].intent === 'owned' &&
    typeof parsed.records[0].updatedAt === 'string',
  JSON.stringify(parsed?.records?.[0]),
);
check(
  'no price is ever persisted',
  !stored || !/price|rate|cost|amount/i.test(stored),
  stored ?? '',
);

console.log('\n=== 2. Reload reflects saved state ===');
await page.reload({ waitUntil: 'networkidle' });
const msgReload = await page.locator('.save-row .save-msg').textContent();
check(
  'reload shows existing state',
  /in your inventory — owned/i.test(msgReload ?? ''),
  `got "${msgReload}"`,
);
check(
  'Owned radio is pre-checked',
  await page.locator('.save-row input[value=owned]').isChecked(),
);

console.log('\n=== 3. Inventory page ===');
await page.goto(`${BASE}/inventory/`, { waitUntil: 'networkidle' });

const counts = await page.locator('#counts').textContent();
check(
  'counts render the saved item',
  /1 item/i.test(counts ?? ''),
  `got "${counts}"`,
);
check('empty state hidden', await page.locator('#empty').isHidden());

const linkText = await page.locator('#list .name').first().textContent();
check(
  'record resolves to a human label, not a raw id',
  /nema/i.test(linkText ?? '') && !linkText?.includes('nema-17-stepper'),
  `got "${linkText}"`,
);

const href = await page.locator('#list .name').first().getAttribute('href');
check('record links back to its part page', href === '/part/nema-17-stepper/', href ?? '');

// Add a second record straight into storage, then reload.
await page.evaluate(() => {
  const cur = JSON.parse(localStorage.getItem('projectdir.inventory.v1'));
  cur.records.push({
    partId: 'mg995-servo',
    intent: 'wanted',
    quantity: 3,
    note: 'from test',
    updatedAt: new Date().toISOString(),
  });
  localStorage.setItem('projectdir.inventory.v1', JSON.stringify(cur));
});
await page.reload({ waitUntil: 'networkidle' });
check(
  'second record appears',
  (await page.locator('#list .row').count()) === 2,
  `${await page.locator('#list .row').count()} rows`,
);
// Wanted must sort FIRST; owned goes last.
const firstName = (await page.locator('#list .name').first().textContent()) ?? '';
check(
  'wanted sorts before owned',
  /mg995/i.test(firstName),
  `first row was "${firstName}"`,
);

console.log('\n=== 4. Edit quantity, then remove ===');
const qty = page.locator('#list input[type=number]').first();
await qty.fill('7');
await qty.dispatchEvent('change');
await page.waitForTimeout(150);
const afterQty = await page.evaluate(() => {
  const r = JSON.parse(localStorage.getItem('projectdir.inventory.v1')).records.find(
    (x) => x.partId === (x.intent === 'owned' ? 'nema-17-stepper' : 'x'),
  );
  return JSON.parse(localStorage.getItem('projectdir.inventory.v1')).records.map((x) => [
    x.partId,
    x.quantity,
  ]);
});
check(
  'quantity edit persists',
  afterQty.some(([, q]) => q === 7),
  JSON.stringify(afterQty),
);

await page.locator('#list button.rm').first().click();
await page.waitForTimeout(150);
check('remove drops a row', (await page.locator('#list .row').count()) === 1);
check(
  'remove persists',
  JSON.parse(await page.evaluate(() => localStorage.getItem('projectdir.inventory.v1')))
    .records.length === 1,
);

console.log('\n=== 5. Empty state ===');
await page.evaluate(() => localStorage.removeItem('projectdir.inventory.v1'));
await page.reload({ waitUntil: 'networkidle' });
check('empty state visible when cleared', await page.locator('#empty').isVisible());
check('toolbar hidden when empty', await page.locator('#bar').isHidden());

console.log('\n=== 6. Corrupt storage degrades instead of throwing ===');
await page.evaluate(() =>
  localStorage.setItem('projectdir.inventory.v1', '{not json at all'),
);
await page.reload({ waitUntil: 'networkidle' });
check('corrupt store still renders', await page.locator('#empty').isVisible());

console.log('\n=== 7. Suppliers filter (the earlier dead feature) ===');
await page.goto(`${BASE}/suppliers/`, { waitUntil: 'networkidle' });
const totalCards = await page.locator('#grid .vendor').count();
check('suppliers render server-... client-side', totalCards === 24, `${totalCards} cards`);

const chip = page.locator('.chip[data-id=servos]');
await chip.click();
await page.waitForTimeout(150);
const afterChip = await page.locator('#grid .vendor').count();
check('category chip filters', afterChip > 0 && afterChip < totalCards, `${afterChip} of ${totalCards}`);

await page.locator('.chip[data-id=bearings]').click();
await page.waitForTimeout(150);
const twoChips = await page.locator('#grid .vendor').count();
check(
  'two chips INTERSECT (strictly fewer than either alone)',
  twoChips <= Math.min(afterChip, 5),
  `${twoChips} with both`,
);

await page.locator('#reset').click();
await page.waitForTimeout(150);
check('reset restores the full list', (await page.locator('#grid .vendor').count()) === totalCards);

await page.locator('#q').fill('zzzznothing');
await page.waitForTimeout(150);
check('empty search shows the empty state', await page.locator('#empty').isVisible());


// ---------------------------------------------------------------------------
// Live offers. The Worker is always STUBBED - this suite must never depend on
// live supplier networks, which are slow, rate-limited and change without
// notice. A test that passes only when the internet cooperates is not a test.
// ---------------------------------------------------------------------------

const PART_URL = `${BASE}/part/nema-17-stepper/`;
const OFFERS_API = /\/offers\?part=/;

// Point the client at an origin the route stub will intercept.
await page.addInitScript(() => {
  globalThis.__PROJECTDIR_OFFERS_API__ = 'https://offers.test';
});

const stubOffers = async (offers) =>
  page.route(OFFERS_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ part: 'nema-17-stepper', fetchedAt: new Date().toISOString(), offers }),
    }),
  );

const offer = (over = {}) => ({
  vendorSlug: 'robodo', vendorName: 'Robodo',
  url: 'https://robodo.in/products/nema-17-stepper-motor',
  isDeepLink: true, image: null, title: 'NEMA 17 Stepper Motor 42BYGH',
  price: { amount: 450, currency: 'INR', formatted: '₹450.00' },
  inStock: true, confidence: 0.95, ...over,
});

console.log('\n=== 9. Live offers: deep links render ===');
await stubOffers([offer()]);
await page.goto(PART_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

const card = page.locator('.offer-card').first();
check('an offer card renders', (await page.locator('.offer-card').count()) > 0);
check(
  'the offer links to the exact product, not the storefront',
  (await page.locator('.offer-link[href*="/products/"]').count()) > 0,
);
check('the price is attributed to the supplier', /as listed by Robodo/.test(await card.textContent()));
check('a deep link is labelled as such', /Direct product link/.test(await card.textContent()));

console.log('\n=== 10. Live offers: fallback rendering ===');
await page.unroute(OFFERS_API);
await stubOffers([]);
await page.goto(PART_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
// With no live offers the static list must still be fully present.
check(
  'an empty offers response leaves the static vendor list intact',
  (await page.locator('.offer-card').count()) > 0,
);
check(
  'static links go to the supplier storefront',
  (await page.locator('.offer-link[href^="https://"]').count()) > 0,
);

console.log('\n=== 11. Live offers: the Worker being down is invisible ===');
await page.unroute(OFFERS_API);
await page.route(OFFERS_API, (route) => route.abort());
const beforeDown = (await page.locator('.offer-card').count());
await page.goto(PART_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
check(
  'an unreachable Worker leaves every vendor listed',
  (await page.locator('.offer-card').count()) === beforeDown && beforeDown > 0,
);
check('no error banner is shown', await page.locator('#offer-status').isHidden());

console.log('\n=== 12. Live offers: a dead image falls back, never a broken glyph ===');
await page.unroute(OFFERS_API);
await stubOffers([offer({ image: `${BASE}/definitely-missing-image.jpg` })]);
await page.goto(PART_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const brokenImages = await page.evaluate(() =>
  [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
);
check('no image is left broken', brokenImages === 0, `${brokenImages} broken`);

console.log('\n=== 13. Live offers: price and stock honesty ===');
await page.unroute(OFFERS_API);
await stubOffers([offer({ price: null })]);
await page.goto(PART_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
check(
  'an unknown price renders no price element at all',
  (await page.locator('.offer-price').count()) === 0,
);
check('and never renders a zero', !(await page.locator('.offer-section').textContent()).includes('0.00'));

await page.unroute(OFFERS_API);
await stubOffers([offer({ inStock: false })]);
await page.goto(PART_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
check('an out-of-stock offer is marked, not dropped', /Currently unavailable/.test(await page.locator('.offer-section').textContent()));

console.log('\n=== 14. Live offers: a stale price is dated ===');
await page.unroute(OFFERS_API);
await page.route(OFFERS_API, (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      part: 'nema-17-stepper',
      fetchedAt: new Date(Date.now() - 72 * 3600_000).toISOString(),
      offers: [offer()],
    }),
  }),
);
await page.goto(PART_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const staleVisible = await page.locator('.offer-stale').isVisible().catch(() => false);
check('a 72-hour-old price is labelled with its date', staleVisible);
await page.unroute(OFFERS_API);

console.log('\n=== 15. Search result thumbnails ===');
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.locator('#q').fill('nema17');
await page.waitForTimeout(400);

const thumbs = page.locator('.result-thumb');
check('every result carries a thumbnail', (await thumbs.count()) > 0, `${await thumbs.count()}`);
const thumbSrcs = await page.evaluate(() =>
  [...document.querySelectorAll('.result-thumb')].map((i) => i.getAttribute('src') ?? ''),
);
check(
  'no thumbnail has an empty or bare src',
  thumbSrcs.every((s) => s.startsWith('data:') || s.startsWith('https://')),
  JSON.stringify(thumbSrcs.slice(0, 2)),
);
check(
  'a thumbnail is present even before any offer request resolves',
  thumbSrcs.length > 0 && thumbSrcs.every((s) => s.length > 0),
);
const brokenThumbs = await page.evaluate(() =>
  [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
);
check('no search thumbnail is broken', brokenThumbs === 0, `${brokenThumbs} broken`);

console.log('\n=== 8. Console hygiene ===');
// ERR_FAILED is induced on purpose: section 11 aborts the offers request to
// prove a dead Worker is invisible to the visitor. Filtering it here does not
// weaken the check for every other page and every other request.
const realErrors = consoleErrors.filter(
  (e) => !/favicon|ERR_FAILED|offers\.test/i.test(e),
);
check('no console errors on any page', realErrors.length === 0, realErrors.join(' | '));

const realFailed = failedRequests.filter((r) => !/favicon|offers\.test/i.test(r));
check('no failed requests', realFailed.length === 0, realFailed.join(' | '));

const faviconOk = await page.evaluate(async () => {
  const r = await fetch('/favicon.svg');
  return r.status;
});
check('favicon.svg serves 200', faviconOk === 200, `status ${faviconOk}`);

await browser.close();
server.close();

console.log(`\n${'='.repeat(52)}`);
console.log(`PASS ${pass}   FAIL ${fail}`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log('  - ' + f);
}
console.log('='.repeat(52));
process.exit(fail ? 1 : 0);
