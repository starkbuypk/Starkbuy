import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { formatPrice } from '../data/products';
import type { WatchCategory, WatchGender } from '../data/products';
import { useAllProducts } from '../hooks/useStoreData';
import { ProductCard } from '../components/ProductCard';
import { IconChevronRight } from '../components/icons/Icons';

const CATEGORIES: WatchCategory[] = ['Analog', 'Chronograph', 'Sports', 'A+ Replica', 'Automatic', 'Luxury', 'Smart', 'Sale'];
const GENDERS: WatchGender[] = ['Men', 'Women', 'Unisex'];
const PAGE_SIZE = 12;

type SortValue = 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
const SORTS: { label: string; value: SortValue }[] = [
  { label: 'Popularity', value: 'popular' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest', value: 'newest' },
  { label: 'Featured', value: 'featured' },
];

function SortDropdown({ sort, onChange }: { sort: SortValue; onChange: (v: SortValue) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const current = SORTS.find(s => s.value === sort)!;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4375rem 0.875rem', background: 'transparent', border: '1px solid rgba(26,22,20,0.10)', borderRadius: '0.5rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 38 }}
      >
        <span style={{ color: 'var(--luna-muted)', fontSize: '0.8125rem' }}>Sort:</span>
        <span style={{ fontWeight: 600 }}>{current.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms', color: 'var(--luna-muted)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)', background: 'rgba(212,204,196,0.98)', border: '1px solid rgba(26,22,20,0.09)', borderRadius: '0.75rem', overflow: 'hidden', zIndex: 200, minWidth: 200, backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {SORTS.map(s => (
            <button
              key={s.value}
              onClick={() => { onChange(s.value); setOpen(false); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.125rem', background: 'transparent', border: 'none', color: s.value === sort ? 'var(--luna-fg)' : 'var(--luna-muted)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', fontWeight: s.value === sort ? 600 : 400, transition: 'background 100ms', borderBottom: '1px solid rgba(26,22,20,0.05)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,22,20,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {s.label}
              {s.value === sort && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--luna-1)" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
      <button
        onClick={() => { onChange(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        disabled={page === 1}
        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.875rem', background: 'transparent', border: '1px solid rgba(26,22,20,0.10)', borderRadius: '0.5rem', color: page === 1 ? 'rgba(201,168,76,0.35)' : 'var(--luna-muted)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', cursor: page === 1 ? 'default' : 'pointer', minHeight: 40 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6" /></svg>
        Prev
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          onClick={() => { onChange(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{ width: 40, height: 40, borderRadius: '0.5rem', background: n === page ? 'rgba(26,22,20,0.12)' : 'transparent', border: n === page ? '1px solid var(--luna-1)' : '1px solid rgba(26,22,20,0.10)', color: n === page ? 'var(--luna-1)' : 'var(--luna-muted)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: n === page ? 700 : 400, cursor: 'pointer' }}
        >
          {n}
        </button>
      ))}

      <button
        onClick={() => { onChange(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        disabled={page === totalPages}
        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.875rem', background: 'transparent', border: '1px solid rgba(26,22,20,0.10)', borderRadius: '0.5rem', color: page === totalPages ? 'rgba(201,168,76,0.35)' : 'var(--luna-muted)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', cursor: page === totalPages ? 'default' : 'pointer', minHeight: 40 }}
      >
        Next
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
      </button>

      <span style={{ fontSize: '0.8125rem', color: 'var(--luna-muted)', marginLeft: '0.25rem' }}>
        Page {page} of {totalPages}
      </span>
    </div>
  );
}

export default function Collections() {
  const { category } = useParams<{ category?: string }>();
  const products = useAllProducts();
  const [sort, setSort] = useState<SortValue>('popular');
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<WatchCategory | 'All'>(
    category ? (CATEGORIES.find(c => c.toLowerCase().replace(/[^a-z]/g, '') === category.replace(/[^a-z]/g, '')) ?? 'All') : 'All'
  );
  const [activeGender, setActiveGender] = useState<WatchGender | 'All'>('All');
  const [inStockOnly, setInStockOnly] = useState(false);

  const catLabel = activeCategory === 'All' ? 'All Watches' : activeCategory;
  useSEO({
    title: activeCategory === 'All' ? 'Shop All Watches | StarkBuy Pakistan' : `${catLabel} Watches in Pakistan | StarkBuy`,
    description: `Browse ${catLabel.toLowerCase()} watches in Pakistan. Cash on delivery available. Free shipping on orders above Rs. 2,000. Shop now at StarkBuy.`,
    canonical: activeCategory === 'All' ? '/collections' : `/collections/${activeCategory.toLowerCase().replace(/[^a-z]/g, '')}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.starkbuypk.com' },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://www.starkbuypk.com/collections' },
        ...(activeCategory !== 'All' ? [{ '@type': 'ListItem', position: 3, name: catLabel, item: `https://www.starkbuypk.com/collections/${activeCategory.toLowerCase().replace(/[^a-z]/g, '')}` }] : []),
      ],
    },
  });

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCategory !== 'All') list = list.filter(p => p.category === activeCategory);
    if (activeGender !== 'All') list = list.filter(p => p.gender === activeGender);
    if (inStockOnly) list = list.filter(p => p.inStock);
    switch (sort) {
      case 'price_asc': list.sort((a, b) => a.codPrice - b.codPrice); break;
      case 'price_desc': list.sort((a, b) => b.codPrice - a.codPrice); break;
      case 'newest': list.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0)); break;
      case 'popular': list.sort((a, b) => b.unitsSold - a.unitsSold); break;
      default: list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return list;
  }, [activeCategory, activeGender, inStockOnly, sort]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleCategoryChange(cat: WatchCategory | 'All') {
    setActiveCategory(cat);
    setPage(1);
  }
  function handleSortChange(s: SortValue) {
    setSort(s);
    setPage(1);
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '1.25rem 1.25rem 3rem' }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--luna-muted)', marginBottom: '1.75rem' }}>
        <Link to="/" style={{ color: 'var(--luna-muted)', textDecoration: 'none' }}>Home</Link>
        <IconChevronRight size={12} />
        <span style={{ color: 'var(--luna-fg)' }}>Shop</span>
        {activeCategory !== 'All' && (
          <>
            <IconChevronRight size={12} />
            <span style={{ color: 'var(--luna-fg)' }}>{activeCategory}</span>
          </>
        )}
      </nav>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem' }}>
        <h1 className="font-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
          {activeCategory === 'All' ? 'All Watches' : activeCategory}
        </h1>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
        {(['All', ...CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            style={{ padding: '0.3125rem 0.875rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 500, fontFamily: 'DM Sans, sans-serif', border: activeCategory === cat ? '1px solid var(--luna-1)' : '1px solid rgba(26,22,20,0.10)', background: activeCategory === cat ? 'rgba(26,22,20,0.09)' : 'transparent', color: activeCategory === cat ? 'var(--luna-1)' : 'var(--luna-muted)', cursor: 'pointer', transition: 'all 150ms', minHeight: 34 }}
            onMouseEnter={e => { if (activeCategory !== cat) { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'; e.currentTarget.style.color = 'var(--luna-fg)'; } }}
            onMouseLeave={e => { if (activeCategory !== cat) { e.currentTarget.style.borderColor = 'rgba(26,22,20,0.10)'; e.currentTarget.style.color = 'var(--luna-muted)'; } }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Toolbar — Filters row + Sort */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(26,22,20,0.06)' }}>
        {/* Gender filter */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {(['All', ...GENDERS] as const).map(g => (
            <button
              key={g}
              onClick={() => { setActiveGender(g); setPage(1); }}
              style={{ padding: '0.3125rem 0.875rem', borderRadius: 'var(--radius)', fontSize: '0.8125rem', fontFamily: 'DM Sans, sans-serif', border: activeGender === g ? '1px solid var(--luna-2)' : '1px solid rgba(26,22,20,0.08)', background: activeGender === g ? 'rgba(154,109,90,0.10)' : 'transparent', color: activeGender === g ? 'var(--luna-2)' : 'var(--luna-muted)', cursor: 'pointer', transition: 'all 150ms', minHeight: 36 }}
            >
              {g}
            </button>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--luna-muted)', cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={inStockOnly} onChange={e => { setInStockOnly(e.target.checked); setPage(1); }} style={{ accentColor: 'var(--luna-1)', width: 14, height: 14 }} />
          In stock only
        </label>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--luna-muted)', whiteSpace: 'nowrap' }}>{filtered.length} watches</span>
          <SortDropdown sort={sort} onChange={handleSortChange} />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--luna-muted)' }}>
          <p style={{ fontSize: '1.0625rem', marginBottom: '1.25rem' }}>No watches match your filters.</p>
          <button onClick={() => { setActiveCategory('All'); setActiveGender('All'); setInStockOnly(false); setPage(1); }} className="btn btn-outline">
            Clear filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1.25rem' }}>
          {paginated.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  );
}
