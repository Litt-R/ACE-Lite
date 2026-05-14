const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const constantsPath = path.join(root, 'src', 'constants.ts');
const constantsContent = fs.readFileSync(constantsPath, 'utf-8');
const match = constantsContent.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);

if (!match) {
  process.exit(1);
}

const version = match[1];
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
const tauriPath = path.join(root, 'src-tauri', 'tauri.conf.json');
const tauri = JSON.parse(fs.readFileSync(tauriPath, 'utf-8'));
tauri.version = version;
fs.writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + '\n');
const cargoPath = path.join(root, 'src-tauri', 'Cargo.toml');
let cargo = fs.readFileSync(cargoPath, 'utf-8');
cargo = cargo.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`);
fs.writeFileSync(cargoPath, cargo);