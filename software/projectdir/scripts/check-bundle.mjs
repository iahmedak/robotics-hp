#!/usr/bin/env node
/**
 * Fails the build if any emitted HTML contains an unresolved source import.
 *
 * Why this exists: Astro's `define:vars` implies `is:inline`, so a script using
 * it is NOT bundled. Any `import` written inside such a block is emitted
 * verbatim into the HTML, pointing at paths like '../lib/filter' that exist in
 * `src/` but not in `dist/`. The page still builds, all unit tests pass, and the
 * feature is dead in the browser with a module-resolution error at runtime.
 *
 * It is invisible to tsc, invisible to astro check, and invisible to vitest.
 * Only reading the built output catches it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const DIST = resolve(process.argv[2] ?? 'dist');

/** Import specifiers that resolve to project source and therefore cannot exist in dist. */
const SOURCE_IMPORT = /(?:\bfrom\s*|\bimport\s*)['"](\.\.?\/[^'"]+)['"]/g;

/** Astro/Vite emit these prefixes legitimately (hashes, /@fs/, data URIs). */
const ALLOWED = [/^\.\/_astro\//, /^\.\/_image\//, /^\.\/assets\//];

let failures = 0;
let filesScanned = 0;

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.html')) {
      filesScanned++;
      const html = readFileSync(full, 'utf8');

      for (const match of html.matchAll(SOURCE_IMPORT)) {
        const spec = match[1];
        if (ALLOWED.some((re) => re.test(spec))) continue;

        // Anything reaching into ../src or a bare relative lib path in dist is a leak.
        failures++;
        console.error(
          `LEAKED IMPORT  ${relative(DIST, full)}\n` +
            `               emits ${JSON.stringify(spec)} — not present in dist.\n` +
            `               Cause: <script define:vars> implies is:inline and is not bundled.\n` +
            `               Fix: pass data via a <script type="application/json"> tag or\n` +
            `               data attributes, and use a plain <script> so Astro bundles it.`,
        );
      }
    }
  }
}

try {
  statSync(DIST);
} catch {
  console.error(`No dist directory at ${DIST}. Run "astro build" first.`);
  process.exit(1);
}

walk(DIST);

if (failures) {
  console.error(`\nbundle check FAILED: ${failures} leaked import(s) across ${filesScanned} page(s).`);
  process.exit(1);
}

console.log(`bundle check OK: ${filesScanned} pages, no leaked imports.`);