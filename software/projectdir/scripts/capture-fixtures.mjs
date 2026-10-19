#!/usr/bin/env node
/**
 * Capture real supplier feed responses for the test suite.
 *
 * Mocks encode assumptions about field names, and the field names are exactly
 * what needs verifying. These are genuine responses, recorded, so a vendor
 * changing their shape shows up as a failing test rather than a silent
 * mis-parse in production.
 *
 * Nothing here throws on a bad response. A blocked or empty vendor is
 * recorded deliberately - the blocked case is the one we most need to keep
 * testing against.
 *
 *   node scripts/capture-fixtures.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const OUT = resolve(process.argv[2] ?? 'workers/live/test/fixtures');
mkdirSync(OUT, { recursive: true });

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const SHOPIFY_HOSTS = ['robodo.in', 'rees52.com', 'quartzcomponents.com', 'robocraze.com'];
const WOO_HOSTS = ['zbotic.in', 'roboticsdna.in'];

async function get(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: controller.signal });
    const body = await res.text();
    return { status: res.status, body, ok: res.ok };
  } catch (error) {
    return { status: 0, body: String(error), ok: false };
  } finally {
    clearTimeout(timer);
  }
}

const write = (name, content) => {
  writeFileSync(join(OUT, name), content, 'utf8');
  console.log(`  wrote ${name} (${content.length} bytes)`);
};

// ---- Shopify ---------------------------------------------------------------
let shopify = null;
for (const host of SHOPIFY_HOSTS) {
  const r = await get(`https://${host}/products.json?limit=25`);
  let parsed = null;
  try {
    parsed = JSON.parse(r.body);
  } catch {
    /* not JSON */
  }
  if (parsed && Array.isArray(parsed.products) && parsed.products.length) {
    shopify = {
      _capturedFrom: `https://${host}/products.json`,
      _capturedAt: new Date().toISOString(),
      _note: 'Real Shopify public feed. Field names are the platform contract.',
      ...parsed,
    };
    console.log(`shopify: ${host} -> ${parsed.products.length} products`);
    break;
  }
  console.log(`shopify: ${host} skipped (${r.status}, ${r.body.slice(0, 40).replace(/\s+/g, ' ')})`);
}
if (shopify) write('shopify-products.json', JSON.stringify(shopify, null, 2));
else console.log('shopify: NO VENDOR RESPONDED - existing fixture left untouched');

// ---- WooCommerce -----------------------------------------------------------
let woo = null;
for (const host of WOO_HOSTS) {
  const r = await get(`https://${host}/wp-json/wc/store/v1/products?per_page=25`);
  let parsed = null;
  try {
    parsed = JSON.parse(r.body);
  } catch {
    /* not JSON */
  }
  if (Array.isArray(parsed) && parsed.length) {
    woo = {
      _capturedFrom: `https://${host}/wp-json/wc/store/v1/products`,
      _capturedAt: new Date().toISOString(),
      _note: 'Real WooCommerce Store API. Note prices.currency_minor_unit: prices are in minor units.',
      products: parsed,
    };
    console.log(`woocommerce: ${host} -> ${parsed.length} products`);
    break;
  }
  console.log(`woocommerce: ${host} skipped (${r.status})`);
}
if (woo) write('woocommerce-products.json', JSON.stringify(woo, null, 2));
else console.log('woocommerce: NO VENDOR RESPONDED - existing fixture left untouched');

// ---- A blocked vendor ------------------------------------------------------
const blockedHost = 'robu.in';
const blocked = await get(`https://${blockedHost}/products.json?limit=1`);
write(
  'cloudflare-challenge.html',
  blocked.body || '<html>Just a moment... challenge placeholder</html>',
);
console.log(`blocked: ${blockedHost} -> HTTP ${blocked.status}, ${blocked.body.length} bytes`);
console.log('\nfixtures refreshed. Commit any that changed - a diff here is a real API change.');