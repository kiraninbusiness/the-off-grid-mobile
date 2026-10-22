import fs from 'node:fs';

const required=['package.json','app.json','eas.json','.env.example'];
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}`);
    process.exit(1);
  }
}

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const app=JSON.parse(fs.readFileSync('app.json','utf8'));
const errors=[];
const warnings=[];

if (pkg.version !== app.expo.version) errors.push(`Version mismatch: package.json=${pkg.version}, app.json.expo.version=${app.expo.version}`);
if (app.version) errors.push(`Remove obsolete top-level app.json version (${app.version}); use expo.version only`);
if (app.expo.android?.package !== 'in.theoffgrid.app') errors.push('Unexpected Android package id');
if (app.expo.ios?.bundleIdentifier !== 'in.theoffgrid.app') errors.push('Unexpected iOS bundle identifier');

const requiredEnv = ['EXPO_PUBLIC_API_URL','EXPO_PUBLIC_EAS_PROJECT_ID','EXPO_PUBLIC_RAZORPAY_KEY_ID'];
const placeholder = (value) => !value || value.includes('example.com') || value.includes('xxxxxxxx') || value.includes('test_or_live_key_here');

const envFile = fs.existsSync('.env') ? '.env' : '.env.example';
const env = fs.readFileSync(envFile,'utf8');
for (const key of requiredEnv) {
  const match = env.match(new RegExp(`^${key}=(.*)$`, 'm'));
  if (!match) {
    errors.push(`${envFile} missing ${key}`);
    continue;
  }
  const value = match[1].trim();
  if (envFile === '.env' && placeholder(value)) errors.push(`${key} in .env still contains a placeholder value`);
}

if (!fs.existsSync('.env')) {
  warnings.push('No .env file found; .env.example is only a template. Set real EAS/API/Razorpay values in your build environment before release.');
}

if (errors.length) {
  console.error(errors.map(x=>`✖ ${x}`).join('\n'));
  process.exit(1);
}

console.log(`✓ The Off Grid release configuration is consistent (v${pkg.version})`);
console.log(`✓ Required production variables are documented in ${envFile}`);
for (const warning of warnings) console.log(`⚠ ${warning}`);
console.log('Next: run npm run typecheck and an EAS Android build with real production environment values.');
