import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = path.resolve('dist');
const siteUrl = (process.env.SITE_URL || 'https://www.starkbuypk.com').replace(/\/+$/, '');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const staticRoutes = [
  '/',
  '/collections',
  '/about',
  '/blog',
  '/support/contact-us',
  '/support/exchange-policy',
  '/support/size-guide',
  '/support/payment-methods',
  '/legal/privacy-policy',
  '/legal/terms-of-service',
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll("'", '&apos;');
}

function routeToOutputFile(route) {
  const segments = route.split('/').filter(Boolean).map(segment => encodeURIComponent(segment));
  return path.join(outputDirectory, ...segments, 'index.html');
}

async function fetchPublicData() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Static catalog generation: Supabase build credentials are absent; emitting static routes only.');
    return { products: [], configuredCategories: [] };
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };
  const [productsResponse, categoriesResponse] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/products?select=data&order=created_at.asc`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/site_config?select=value&key=eq.categories`, { headers }),
  ]);
  if (!productsResponse.ok) throw new Error(`Catalog request failed (${productsResponse.status})`);
  if (!categoriesResponse.ok) throw new Error(`Category request failed (${categoriesResponse.status})`);

  const productRows = await productsResponse.json();
  const categoryRows = await categoriesResponse.json();
  return {
    products: productRows.map(row => row.data).filter(product => product?.slug && product?.name),
    configuredCategories: categoryRows[0]?.value ?? [],
  };
}

function categorySlug(category) {
  return category.toLowerCase().replace(/[^a-z]/g, '');
}

function configuredCategorySlug(category) {
  const fromRoute = category.to?.split('/').filter(Boolean).pop();
  return fromRoute || categorySlug(category.label);
}

function categoryEntries(products, configuredCategories) {
  const entries = new Map();
  for (const category of configuredCategories) {
    if (category?.enabled !== false && category?.label) {
      entries.set(configuredCategorySlug(category), category.label);
    }
  }
  for (const product of products) {
    if (product.category) {
      const slug = categorySlug(product.category);
      if (!entries.has(slug)) entries.set(slug, product.category);
    }
  }
  return [...entries].map(([slug, label]) => ({ slug, label }));
}

function pageHtml(shell, title, description, canonicalUrl) {
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  return shell
    .replace(/<title>.*?<\/title>/s, `<title>${escapedTitle}</title>`)
    .replace(
      /<\/head>/,
      `<meta name="description" content="${escapedDescription}">` +
      `<link rel="canonical" href="${escapeHtml(canonicalUrl)}"></head>`,
    );
}

async function emitPage(shell, route, title, description) {
  const file = routeToOutputFile(route);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, pageHtml(shell, title, description, `${siteUrl}${route}`));
}

const shell = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
let products = [];
let configuredCategories = [];
try {
  ({ products, configuredCategories } = await fetchPublicData());
} catch (error) {
  console.warn(`Static catalog generation skipped: ${error.message}`);
}

const categories = categoryEntries(products, configuredCategories);
const dynamicRoutes = [
  ...categories.map(category => `/collections/${category.slug}`),
  ...products.map(product => `/product/${encodeURIComponent(product.slug)}`),
];
const routes = [...new Set([...staticRoutes, ...dynamicRoutes])];

await Promise.all([
  ...categories.map(category => emitPage(
    shell,
    `/collections/${category.slug}`,
    `${category.label} Watches in Pakistan | StarkBuy`,
    `Shop ${category.label} watches at StarkBuy with cash on delivery across Pakistan.`,
  )),
  ...products.map(product => emitPage(
    shell,
    `/product/${encodeURIComponent(product.slug)}`,
    `${product.name} | StarkBuy Pakistan`,
    `${product.description || `Shop the ${product.name} watch at StarkBuy.`}`.slice(0, 155),
  )),
]);

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map(route => `  <url><loc>${escapeXml(`${siteUrl}${route}`)}</loc></url>`),
  '</urlset>',
  '',
].join('\n');

await writeFile(path.join(outputDirectory, 'sitemap.xml'), sitemap);
console.log(`Static generation: ${routes.length} sitemap URLs, ${dynamicRoutes.length} catalog pages.`);
