import fs from 'fs';
import path from 'path';

console.log('🔍 Validando Fixes de Seguridad\n');

// 1. Validar security headers en next.config.js
console.log('1️⃣  Validando Security Headers (next.config.js)');
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf-8');

const securityChecks = {
  'X-Frame-Options': /'X-Frame-Options'.*?'DENY'/,
  'X-Content-Type-Options': /'X-Content-Type-Options'.*?'nosniff'/,
  'Referrer-Policy': /'Referrer-Policy'/,
  'Strict-Transport-Security': /'Strict-Transport-Security'/,
};

let headersOk = true;
for (const [header, regex] of Object.entries(securityChecks)) {
  if (regex.test(nextConfigContent)) {
    console.log(`   ✅ ${header}`);
  } else {
    console.log(`   ❌ ${header} NO ENCONTRADO`);
    headersOk = false;
  }
}

if (headersOk) {
  console.log('   ✅ Todos los security headers están configurados\n');
} else {
  console.log('   ⚠️  Algunos headers faltan\n');
}

// 2. Validar middleware.ts existe
console.log('2️⃣  Validando Middleware (src/middleware.ts)');
const middlewarePath = path.join(process.cwd(), 'src', 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8');
  
  const middlewareChecks = {
    'Rate limit store': /rateLimitStore/,
    'Check rate limit function': /checkRateLimit/,
    'resolveRateLimitRoute': /resolveRateLimitRoute/,
    'getRateLimitPolicy': /getRateLimitPolicy/,
    'HTTP 429 response': /status.*429/,
  };
  
  let middlewareOk = true;
  for (const [check, regex] of Object.entries(middlewareChecks)) {
    if (regex.test(middlewareContent)) {
      console.log(`   ✅ ${check}`);
    } else {
      console.log(`   ❌ ${check} NO ENCONTRADO`);
      middlewareOk = false;
    }
  }
  
  if (middlewareOk) {
    console.log('   ✅ Middleware correctamente configurado\n');
  } else {
    console.log('   ⚠️  Middleware incompleto\n');
  }
} else {
  console.log('   ❌ middleware.ts NO EXISTE\n');
}

// 3. Validar page bounds en API routes
console.log('3️⃣  Validando Page Parameter Bounds');
const offersRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'offers', 'route.ts');
const storeOffersRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'stores', '[slug]', 'offers', 'route.ts');

const pageBoundsRegex = /safePage.*Math\.min.*Math\.max/;

let pageBoundsOk = true;

if (fs.existsSync(offersRoutePath)) {
  const offersContent = fs.readFileSync(offersRoutePath, 'utf-8');
  if (pageBoundsRegex.test(offersContent)) {
    console.log('   ✅ /api/offers - page bounds OK');
  } else {
    console.log('   ❌ /api/offers - page bounds NO CONFIGURADO');
    pageBoundsOk = false;
  }
}

if (fs.existsSync(storeOffersRoutePath)) {
  const storeOffersContent = fs.readFileSync(storeOffersRoutePath, 'utf-8');
  if (pageBoundsRegex.test(storeOffersContent)) {
    console.log('   ✅ /api/stores/[slug]/offers - page bounds OK');
  } else {
    console.log('   ❌ /api/stores/[slug]/offers - page bounds NO CONFIGURADO');
    pageBoundsOk = false;
  }
}

if (pageBoundsOk) {
  console.log('   ✅ Page bounds correctamente configurados\n');
}

// 4. Validar discount threshold
console.log('4️⃣  Validando MAX_REASONABLE_DISCOUNT_PCT');
const offerQualityPath = path.join(process.cwd(), 'scripts', 'lib', 'offerQuality.ts');
if (fs.existsSync(offerQualityPath)) {
  const offerQualityContent = fs.readFileSync(offerQualityPath, 'utf-8');
  if (/MAX_REASONABLE_DISCOUNT_PCT\s*=\s*85/.test(offerQualityContent)) {
    console.log('   ✅ MAX_REASONABLE_DISCOUNT_PCT = 85 ✅\n');
  } else {
    console.log('   ❌ MAX_REASONABLE_DISCOUNT_PCT NO ES 85\n');
  }
}

// 5. Validar categoryMapper
console.log('5️⃣  Validando Category Mapper (fiambres/embutidos)');
const categoryMapperPath = path.join(process.cwd(), 'scripts', 'lib', 'categoryMapper.ts');
if (fs.existsSync(categoryMapperPath)) {
  const categoryMapperContent = fs.readFileSync(categoryMapperPath, 'utf-8');
  if (/fiambre|charcuter/.test(categoryMapperContent)) {
    console.log('   ✅ Patrón fiambre/charcuter agregado\n');
  } else {
    console.log('   ❌ Patrón fiambre/charcuter NO ENCONTRADO\n');
  }
}

console.log('✅ Validación completa\n');
