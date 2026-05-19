/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Walk the production `dist/node_modules/` tree built by
 * `scripts/package.mjs` and emit the binary-tar's LICENSE / NOTICE /
 * licenses/ subtree.
 *
 * Apache distribution rule: every bundled third-party module's license
 * is reproduced in the binary tarball. The source tarball ships only
 * first-party source (top-level LICENSE + NOTICE are enough), but the
 * binary bundles npm dependencies and therefore needs an expanded LICENSE
 * (license-family summary) and NOTICE (third-party NOTICE pass-throughs)
 * plus per-package license texts under licenses/<name>-<version>/.
 *
 * Output (relative to repo `dist/`):
 *   LICENSE                 — Apache-2.0 + grouped third-party summary
 *   NOTICE                  — ASF + concatenated third-party NOTICEs
 *   licenses/<pkg>-<ver>/   — verbatim LICENSE-ish files from each dep
 *   .dependency-report.json — { packages: [...] } for check-dist-licenses
 *
 * Run after `pnpm package`. Re-runs are idempotent: the script clears
 * dist/licenses/ first.
 */

import { execSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const distDir = resolve(repoRoot, 'dist');
const nmDir = resolve(distDir, 'node_modules');
const licensesOutDir = resolve(distDir, 'licenses');
const templatesDir = resolve(repoRoot, 'dist-material/release-docs');

if (!existsSync(nmDir)) {
  console.error(
    `FATAL: ${nmDir} does not exist. Run \`pnpm package\` first.`,
  );
  process.exit(1);
}

const LICENSE_FILE_PATTERNS = [
  /^LICENSE$/i,
  /^LICENCE$/i,
  /^LICENSE\.(md|txt|rst)$/i,
  /^LICENCE\.(md|txt|rst)$/i,
  /^COPYING$/i,
  /^COPYING\.(md|txt|rst)$/i,
  /^COPYRIGHT$/i,
  /^COPYRIGHT\.(md|txt|rst)$/i,
];
const NOTICE_FILE_PATTERNS = [/^NOTICE$/i, /^NOTICE\.(md|txt|rst)$/i];

function pickFile(dir, patterns) {
  if (!existsSync(dir)) return null;
  for (const entry of readdirSync(dir)) {
    if (patterns.some((p) => p.test(entry))) return join(dir, entry);
  }
  return null;
}

// Find every realpath-distinct package directory under dist/node_modules.
// pnpm's layout puts true packages under `.pnpm/<pkg>@<ver>(_<peers>)/node_modules/<pkg>/`,
// with top-level entries being symlinks into that store. We use `pnpm list`
// to get the canonical production dep graph and resolve each entry's
// realpath to get the package.json we should be reading.
function collectPackages() {
  // `pnpm list --prod --depth Infinity --json` returns the realized
  // production dep tree. We flatten it ourselves so first-party workspace
  // packages can be filtered out by name prefix.
  const raw = execSync(
    'pnpm list --prod --depth Infinity --json',
    {
      cwd: distDir,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  ).toString();
  const json = JSON.parse(raw);
  // pnpm list returns an array of root packages. dist/ has exactly one.
  const root = Array.isArray(json) ? json[0] : json;

  const seen = new Map(); // key: name@version → { path, name, version }
  function walk(deps) {
    if (!deps) return;
    for (const [name, info] of Object.entries(deps)) {
      // Skip first-party workspace packages — they're our own code.
      if (name.startsWith('@skywalking-horizon-ui/')) {
        walk(info.dependencies);
        continue;
      }
      const version = info.version;
      const key = `${name}@${version}`;
      if (seen.has(key)) continue;
      const pkgPath = info.path;
      if (!pkgPath || !existsSync(pkgPath)) {
        console.warn(`WARN: package path missing for ${key}: ${pkgPath}`);
        continue;
      }
      seen.set(key, { name, version, path: pkgPath });
      walk(info.dependencies);
    }
  }
  walk(root.dependencies);
  return Array.from(seen.values()).sort((a, b) =>
    a.name === b.name ? a.version.localeCompare(b.version) : a.name.localeCompare(b.name),
  );
}

function normalizeLicense(pkgJson) {
  const lic = pkgJson.license;
  if (typeof lic === 'string') return lic;
  if (lic && typeof lic === 'object' && typeof lic.type === 'string') {
    return lic.type;
  }
  if (Array.isArray(pkgJson.licenses)) {
    // Deprecated form. Join SPDX-style.
    return pkgJson.licenses.map((l) => l.type || l).filter(Boolean).join(' OR ');
  }
  return 'UNKNOWN';
}

function readPkgJson(pkgPath) {
  const p = join(pkgPath, 'package.json');
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn(`WARN: cannot parse ${p}: ${e.message}`);
    return null;
  }
}

const packages = collectPackages();

// Reset output directory
rmSync(licensesOutDir, { recursive: true, force: true });
mkdirSync(licensesOutDir, { recursive: true });

const report = [];
const byLicense = new Map();
const noticePieces = [];

for (const pkg of packages) {
  const pj = readPkgJson(pkg.path);
  if (!pj) continue;
  const license = normalizeLicense(pj);
  const homepage = pj.homepage || pj.repository?.url || pj.repository || '';
  const entry = {
    name: pkg.name,
    version: pkg.version,
    license,
    homepage: typeof homepage === 'string' ? homepage : '',
    licenseFile: null,
    noticeFile: null,
  };

  const slug = `${pkg.name.replace(/\//g, '__')}-${pkg.version}`;
  const outDir = join(licensesOutDir, slug);

  const licFile = pickFile(pkg.path, LICENSE_FILE_PATTERNS);
  if (licFile) {
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const dest = join(outDir, relative(pkg.path, licFile));
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(licFile, dest);
    entry.licenseFile = relative(distDir, dest);
  }
  const noticeFile = pickFile(pkg.path, NOTICE_FILE_PATTERNS);
  if (noticeFile) {
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const dest = join(outDir, relative(pkg.path, noticeFile));
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(noticeFile, dest);
    entry.noticeFile = relative(distDir, dest);
    noticePieces.push(
      `------ ${pkg.name}@${pkg.version} ------\n${readFileSync(
        noticeFile,
        'utf8',
      ).trim()}\n`,
    );
  }

  report.push(entry);
  const bucket = byLicense.get(license) ?? [];
  bucket.push(entry);
  byLicense.set(license, bucket);
}

// Render LICENSE.tpl → dist/LICENSE
const groupLines = [];
const sortedLicenses = Array.from(byLicense.keys()).sort();
for (const lic of sortedLicenses) {
  groupLines.push(`\n--- ${lic} ---\n`);
  for (const e of byLicense.get(lic)) {
    const ref = e.licenseFile ? ` (${e.licenseFile})` : '';
    groupLines.push(`  * ${e.name}@${e.version}${ref}`);
  }
}
const licenseTpl = readFileSync(join(templatesDir, 'LICENSE.tpl'), 'utf8');
const licenseOut = licenseTpl.replace('{{ .Groups }}', groupLines.join('\n'));
writeFileSync(join(distDir, 'LICENSE'), licenseOut);

// Render NOTICE.tpl → dist/NOTICE
const noticeTpl = readFileSync(join(templatesDir, 'NOTICE.tpl'), 'utf8');
const year = new Date().getUTCFullYear();
const noticeOut = noticeTpl
  .replace('{{ .Year }}', String(year))
  .replace(
    '{{ .Notices }}',
    noticePieces.length > 0
      ? noticePieces.join('\n')
      : '(No third-party NOTICE files present in bundled dependencies.)\n',
  );
writeFileSync(join(distDir, 'NOTICE'), noticeOut);

// Machine-readable report for the check step.
writeFileSync(
  join(distDir, '.dependency-report.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      packageCount: report.length,
      packages: report,
      byLicense: Object.fromEntries(
        sortedLicenses.map((l) => [l, byLicense.get(l).length]),
      ),
    },
    null,
    2,
  ),
);

console.log(
  `Wrote dist/LICENSE, dist/NOTICE, dist/licenses/ (${report.length} packages, ` +
    `${sortedLicenses.length} license families).`,
);
