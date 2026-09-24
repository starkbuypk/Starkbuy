import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'product';
  jsonLd?: object | object[];
}

const SITE = 'https://www.starkbuypk.com';
const SITE_NAME = 'StarkBuy';
const DEFAULT_OG_IMAGE = `${SITE}/og-cover.jpg`;

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

function setJsonLd(data: object | object[]) {
  const id = 'seo-jsonld';
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  // Wrap multiple schemas in @graph for cleaner validation
  const schemas = Array.isArray(data) ? data : [data];
  script.textContent = schemas.length === 1
    ? JSON.stringify(schemas[0])
    : JSON.stringify({ '@context': 'https://schema.org', '@graph': schemas.map(s => { const { '@context': _, ...rest } = s as Record<string, unknown>; return rest; }) });
}

export function useSEO({ title, description, canonical, ogImage, ogType = 'website', jsonLd }: SEOProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical ? `${SITE}${canonical}` : SITE;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const desc = description || 'Shop premium watches in Pakistan. Cash on delivery. Free shipping above Rs. 2,000. Analog, Chronograph, Sports, Automatic & more.';

  useEffect(() => {
    document.title = fullTitle;

    // Basic meta
    setMeta('name', 'description', desc);

    // Open Graph
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', 'en_PK');

    // Twitter / X
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', image);

    // Canonical
    setCanonical(canonicalUrl);

    // JSON-LD
    if (jsonLd) setJsonLd(jsonLd);

    return () => {
      // Reset to site defaults on unmount so next page starts clean
      document.title = `${SITE_NAME} — Luxury Watches Pakistan`;
    };
  }, [fullTitle, desc, canonicalUrl, image, ogType]);
}
