import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../public/assets/manifest.json', import.meta.url), 'utf8'));
const errors = [];
const ids = new Set();

async function validateAsset(asset, location) {
  for (const field of ['id', 'name', 'kind', 'creator', 'licence', 'status']) {
    if (typeof asset[field] !== 'string' || asset[field].trim().length === 0) {
      errors.push(`${location}: missing ${field}`);
    }
  }
  if (ids.has(asset.id)) errors.push(`${location}: duplicate asset id ${asset.id}`);
  ids.add(asset.id);

  if (asset.kind === 'external' && !/^https:\/\//.test(asset.sourceUrl || '')) {
    errors.push(`${location}: external asset needs an https sourceUrl`);
  }
  if (asset.status === 'approved' && asset.kind === 'external' && !asset.attribution) {
    errors.push(`${location}: approved external asset needs attribution guidance`);
  }

  if (asset.kind === 'procedural' && asset.status === 'approved') {
    if (typeof asset.authoringPath !== 'string' || !asset.authoringPath.includes('#')) {
      errors.push(`${location}: approved procedural asset needs a source path and symbol`);
      return;
    }
    const [sourcePath, symbol] = asset.authoringPath.split('#', 2);
    try {
      const source = await readFile(new URL('../' + sourcePath, import.meta.url), 'utf8');
      if (!source.includes(symbol)) errors.push(`${location}: source symbol "${symbol}" not found in ${sourcePath}`);
    } catch {
      errors.push(`${location}: source file not found: ${sourcePath}`);
    }
  }
}

if (manifest.project !== 'Eterna') errors.push('manifest project must be Eterna');
if (!Array.isArray(manifest.assets) || !Array.isArray(manifest.externalCandidates)) {
  errors.push('manifest must include assets and externalCandidates arrays');
} else {
  for (let i = 0; i < manifest.assets.length; i++) await validateAsset(manifest.assets[i], `assets[${i}]`);
  for (let i = 0; i < manifest.externalCandidates.length; i++) await validateAsset(manifest.externalCandidates[i], `externalCandidates[${i}]`);
}

if (errors.length) {
  console.error('Asset manifest audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Asset manifest OK: ${manifest.assets.length} approved project assets, ${manifest.externalCandidates.length} researched external candidates.`);
