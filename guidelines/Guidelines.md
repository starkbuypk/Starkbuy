# StarkBuy — Design System & Figma Theme Template
**Precision-Editorial Luxury E-Commerce**
Version 1.0 | Compatible with WordPress `theme.json`, Elementor, and Bricks Builder

---

## Page Structure (Figma Canvas Architecture)

| Page | Contents |
|------|----------|
| 🎨 Page 1 — Design System & Tokens | Color palette, typography scale, spacing, shadows, radius |
| 🧩 Page 2 — Component Library | All master components with variants, Auto Layout |
| 📱 Page 3 — Responsive Page Templates | Desktop (1440px), Tablet (768px), Mobile (375px) |
| 🛠 Page 4 — Developer Notes & WP Mapping | Block boundaries, WooCommerce dynamic field tags |

---

## 1. Design Tokens

### 1.1 Colors — WordPress `theme.json` Compatible

```json
{
  "settings": {
    "color": {
      "palette": [
        { "slug": "primary",         "color": "#0F0E0C", "name": "Primary (Ink Black)" },
        { "slug": "primary-hover",   "color": "#2A2A28", "name": "Primary Hover" },
        { "slug": "secondary",       "color": "#C9A84C", "name": "Secondary (Warm Gold)" },
        { "slug": "accent",          "color": "#A88A3A", "name": "Accent (Deep Gold)" },
        { "slug": "surface",         "color": "#FFFFFF", "name": "Surface White" },
        { "slug": "background",      "color": "#F8F7F5", "name": "Background (Warm Off-White)" },
        { "slug": "card",            "color": "#FFFFFF", "name": "Card" },
        { "slug": "text-heading",    "color": "#0F0E0C", "name": "Text / Heading" },
        { "slug": "text-body",       "color": "#0F0E0C", "name": "Text / Body" },
        { "slug": "text-muted",      "color": "#6B6B6B", "name": "Text / Muted" },
        { "slug": "feedback-success","color": "#3A7A38", "name": "Feedback / Success" },
        { "slug": "feedback-warning","color": "#C9A84C", "name": "Feedback / Warning" },
        { "slug": "feedback-error",  "color": "#C44830", "name": "Feedback / Error" },
        { "slug": "rule",            "color": "rgba(15,14,12,0.10)", "name": "Hairline Rule" }
      ]
    }
  }
}
```

**CSS Custom Properties (src/index.css)**

```css
:root {
  /* Brand */
  --color-primary:          #0F0E0C;
  --color-primary-hover:    #2A2A28;
  --color-secondary:        #C9A84C;   /* gold */
  --color-accent:           #A88A3A;   /* deep gold */

  /* Surfaces */
  --color-surface:          #FFFFFF;
  --color-background:       #F8F7F5;
  --color-card:             #FFFFFF;

  /* Text */
  --color-text-heading:     #0F0E0C;
  --color-text-body:        #0F0E0C;
  --color-text-muted:       #6B6B6B;

  /* Feedback */
  --color-success:          #3A7A38;
  --color-warning:          #C9A84C;
  --color-error:            #C44830;

  /* Structure */
  --color-rule:             rgba(15,14,12,0.10);
}
```

---

### 1.2 Typography Scale

**Font Pairing:**
- **Display / Headings:** Cormorant Garamond (serif) — editorial authority
- **Body / UI:** DM Sans (sans-serif) — precise readability
- **Mono / Labels:** DM Mono (optional for technical specs)

| Token | Font | Size | Weight | Line Height | Letter Spacing |
|-------|------|------|--------|-------------|----------------|
| `font-size/display` | Cormorant Garamond | clamp(2.5rem, 6vw, 5rem) | 700 | 1.05 | -0.02em |
| `font-size/h1` | Cormorant Garamond | clamp(1.625rem, 3vw, 2.375rem) | 700 | 1.08 | -0.02em |
| `font-size/h2` | Cormorant Garamond | clamp(1.75rem, 4vw, 2.5rem) | 600 | 1.12 | -0.02em |
| `font-size/h3` | DM Sans | 1.25rem / 20px | 600 | 1.3 | -0.01em |
| `font-size/h4` | DM Sans | 1rem / 16px | 600 | 1.35 | -0.01em |
| `font-size/body-large` | DM Sans | 1.125rem / 18px | 400 | 1.65 | 0 |
| `font-size/body-regular` | DM Sans | 0.9375rem / 15px | 400 | 1.65 | -0.005em |
| `font-size/body-small` | DM Sans | 0.875rem / 14px | 400 | 1.7 | 0 |
| `font-size/caption` | DM Sans | 0.75rem / 12px | 400 | 1.5 | 0.01em |
| `font-size/eyebrow` | DM Sans | 0.6875rem / 11px | 500 | 1.4 | 0.18em (uppercase) |
| `font-size/button` | DM Sans | 0.875rem / 14px | 700 | 1 | 0.03em |
| `font-size/button-sm` | DM Sans | 0.75rem / 12px | 700 | 1 | 0.08em (uppercase) |

**WordPress `theme.json` Typography:**
```json
{
  "settings": {
    "typography": {
      "fontFamilies": [
        { "fontFamily": "Cormorant Garamond, serif", "slug": "display", "name": "Display" },
        { "fontFamily": "DM Sans, sans-serif", "slug": "body", "name": "Body" }
      ],
      "fontSizes": [
        { "slug": "display", "size": "clamp(2.5rem, 6vw, 5rem)", "name": "Display" },
        { "slug": "h1",      "size": "clamp(1.625rem, 3vw, 2.375rem)", "name": "H1" },
        { "slug": "h2",      "size": "clamp(1.75rem, 4vw, 2.5rem)", "name": "H2" },
        { "slug": "h3",      "size": "1.25rem",   "name": "H3" },
        { "slug": "large",   "size": "1.125rem",  "name": "Body Large" },
        { "slug": "regular", "size": "0.9375rem", "name": "Body Regular" },
        { "slug": "small",   "size": "0.875rem",  "name": "Body Small" },
        { "slug": "caption", "size": "0.75rem",   "name": "Caption" }
      ]
    }
  }
}
```

---

### 1.3 Spacing — 8pt Grid

| Token | Value | Usage |
|-------|-------|-------|
| `spacing/4`  | 4px (0.25rem)  | Internal micro gaps |
| `spacing/8`  | 8px (0.5rem)   | Compact gaps, badge padding |
| `spacing/12` | 12px (0.75rem) | Chip padding, small gaps |
| `spacing/16` | 16px (1rem)    | Component padding |
| `spacing/20` | 20px (1.25rem) | Section internal padding |
| `spacing/24` | 24px (1.5rem)  | Section horizontal padding |
| `spacing/32` | 32px (2rem)    | Section vertical margin |
| `spacing/40` | 40px (2.5rem)  | Between sections |
| `spacing/48` | 48px (3rem)    | Section gaps |
| `spacing/64` | 64px (4rem)    | Page-level breathing |

**Breakpoints:**
| Name | Width | Container |
|------|-------|-----------|
| Mobile | 375px | 100% – 32px |
| Tablet | 768px | 100% – 48px |
| Desktop | 1280px | 1280px |
| Wide | 1440px | 1200px max |

---

### 1.4 Radius & Elevation

**Radius (minimal — precision system):**

| Token | Value | Usage |
|-------|-------|-------|
| `radius/none` | 0 | Badges, sharp elements |
| `radius/sm`   | 2px | Buttons, chips, inputs |
| `radius/md`   | 4px | Cards (when used) |
| `radius/lg`   | 8px | Modals, drawers |
| `radius/full` | 9999px | Circular avatars, dot indicators |

> **System default is `radius/sm` (2px).** The visual language prioritizes sharp, instrument-precision edges over rounded consumer forms.

**Shadows:**

| Token | Value | Usage |
|-------|-------|-------|
| `shadow/rule` | `0 1px 0 rgba(15,14,12,0.07)` | Bottom hairline — replaces box shadows |
| `shadow/sm`   | `0 2px 8px rgba(15,14,12,0.08)` | Dropdowns, tooltips |
| `shadow/md`   | `0 4px 24px rgba(15,14,12,0.10)` | Modals, cart drawer |
| `shadow/gold` | `0 0 0 1.5px #C9A84C` | Gold focus ring / active state |

> **Avoid `shadow/lg` with vertical blur.** The system uses rules and rings, not floating cards.

---

## 2. Component Library

### 2.1 Navigation & Header

**Top Announcement Bar**
- Height: 32px
- Background: `color/primary` (#0F0E0C)
- Text: 0.75rem, letter-spacing 0.06em, `rgba(255,255,255,0.82)`
- Content: dismissible promotional text + optional icon

**Main Navbar**
- Height: 64px desktop / 56px mobile
- Background: `color/surface` with `backdrop-filter: blur(20px)` on scroll
- Border-bottom: `color/rule` (hairline)
- Left: Logo (Cormorant Garamond wordmark)
- Center: Category nav links (DM Sans 0.875rem, weight 500)
- Right: Search, Wishlist, Account, Cart (icon buttons 40×40)
- Cart badge: `color/error` circle, DM Sans 0.625rem bold
- Mobile: Hamburger → slide-in drawer (full-height, 320px wide)

---

### 2.2 Buttons

All buttons use `radius/sm` (2px), DM Sans, min-height 44px (desktop) / 40px (mobile).

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| **Primary** | `#0F0E0C` | `#FFFFFF` | none | `#2A2A28` |
| **Secondary** | transparent | `#0F0E0C` | 1px `rgba(15,14,12,0.14)` | border → `#C9A84C` |
| **Outline / Gold** | transparent | `#C9A84C` | 1px `rgba(201,168,76,0.45)` | bg `rgba(201,168,76,0.08)` |
| **Ghost** | transparent | `#0F0E0C` | none | bg `rgba(15,14,12,0.06)` |

**States:** Default → Hover → Focus (gold ring `shadow/gold`) → Disabled (opacity 0.4) → Loading (spinner inline)

**Sizes:**
- `btn/lg`: padding 0.875rem 2rem, font 1rem
- `btn/md`: padding 0.6875rem 1.375rem, font 0.875rem (default)
- `btn/sm`: padding 0.375rem 0.875rem, font 0.75rem uppercase

---

### 2.3 Form Controls

**Text Input**
- Height: 44px
- Border: 1px `rgba(15,14,12,0.14)`, radius 2px
- Focus: border `rgba(201,168,76,0.6)`, box-shadow `0 0 0 3px rgba(201,168,76,0.1)`
- Error: border `color/error`, helper text below in error color
- Placeholder: `color/text-muted`

**Chip Selector (replaces pills)**
- Flat square, border 1px `rgba(15,14,12,0.14)`, radius 0
- Active: border `color/secondary`, bg `rgba(201,168,76,0.07)`, font-weight 600
- Use for: Color variants, Strap type, Size selection

**Quantity Stepper**
- Flat bordered box, no radius
- Internal dividers between − / count / +
- Height: 36px, min-width 112px

---

### 2.4 Product Card

**Anatomy (top to bottom):**
1. **Image container** — aspectRatio 3:4, overflow hidden, `background: #EBEBEB`
   - Top-left: Badge stack (sharp rectangles)
   - Top-right: Wishlist button (28×28, no radius)
   - Sold Out: dark overlay + uppercase label
   - Hover: image `scale(1.05)` transition 400ms
2. **Border-top rule** — 1px `rgba(15,14,12,0.10)` → turns gold `#C9A84C` on hover
3. **Product name** — Cormorant Garamond, 1.0625rem, weight 600, `letterSpacing -0.01em`
4. **Row: Rating (left) + Price (right)** — gold `#C9A84C`, tabular-nums, weight 700
5. **Original price** (if on sale) — strikethrough, muted, aligned right
6. **Add to Bag button** — Primary (black), full width, 38px, uppercase 0.75rem

**Grid:** `repeat(auto-fill, minmax(190px, 1fr))`, gap 1rem

**WooCommerce tags:**
```
{{product.name}}  {{product.price}}  {{product.sale_price}}
{{product.rating}}  {{product.review_count}}  {{product.image}}
{{product.badge.sale}}  {{product.badge.new}}  {{product.is_in_stock}}
```

---

### 2.5 Cart Drawer / Mini-Cart

- Width: min(360px, 100vw)
- Slide in from right, overlay backdrop
- Header: "Your Bag" + item count + close button
- Item row: 64×80 image | name + variant | qty stepper | price | remove
- Divider: hairline rule
- Footer (sticky): Subtotal row + "Checkout" Primary btn + "View Cart" Ghost btn

---

### 2.6 Filter & Sort Bar (Archive/Shop Page)

**Sidebar (desktop, 240px):**
- Category list: plain text links, active = gold color + left gold border-rule
- Price range: custom range slider, gold thumb
- Tag filters: flat chips (`.chip` pattern)

**Top bar (mobile):**
- "Filter" + "Sort" buttons (btn/secondary), open bottom-sheet drawer

**Sort Dropdown:**
- Custom select, 44px height, flat border, no radius

---

### 2.7 Badges

Sharp rectangles (radius: 0). All caps, letter-spacing 0.06-0.08em.

| Type | Background | Text |
|------|-----------|------|
| Sale | `#D94030` | `#FFFFFF` |
| New | `#0F0E0C` | `#FFFFFF` |
| Limited | `#C9A84C` | `#111111` |
| In Stock | transparent | `#3A7A38` |
| Sold Out | transparent | `#C44830` |

---

### 2.8 Footer

4-column layout (desktop) → stacked (mobile)
- Col 1: Logo + brand description + social icons
- Col 2: Quick Links
- Col 3: Customer Service
- Col 4: Newsletter (input + btn/primary)
- Bottom bar: Copyright | Privacy | Terms | Payment icons (flat SVG)
- Background: `color/primary` (#0F0E0C)
- Text: `rgba(255,255,255,0.65)`
- Links hover: `color/secondary` (#C9A84C)
- Top border: 1px `rgba(255,255,255,0.08)`

---

## 3. Page Templates

### 3.1 `front-page` — Homepage

```
[Announcement Bar — 32px]
[Navbar — 64px, glass on scroll]
[Hero Slider — min(90vh, 720px)]
  - Background image/video (cover)
  - Dark gradient overlay (left → fade right)
  - Eyebrow label (gold)
  - H1 Display heading (Cormorant, white)
  - Subline (DM Sans, rgba white)
  - CTA buttons (Primary black + Outline light)
  - Dot navigation + arrow controls
[USP Strip — 4-col ruled grid]
  - Truck / MapPin / Shield / Refresh icons + label + sub
[Prepaid Promo Banner]
  - White surface, left 3px gold rule
  - Badge + headline + CTA btn/secondary
[Category Strip]
  - Eyebrow label + "View all" link
  - Grid: auto-fill minmax(140px,1fr) — square image + name
[Featured Products]
  - Eyebrow + H2 display heading + "Full collection" link
  - Product card grid
[Dual Promo Editorial Section]
[New Arrivals]
[Testimonials]
[Trust Footer Strip]
[Footer]
```

---

### 3.2 `archive-product` — Shop / Catalog Page

```
[Navbar]
[Breadcrumb — DM Sans 0.75rem, muted, hairline rule below]
[Page header — H1 + product count]
[Layout: Sidebar (240px) | Product Grid (fill)]
  Sidebar:
    - Filter sections separated by hairline rules
    - Each filter: eyebrow label + chip group or link list
  Grid:
    - Sort bar (top-right): result count + sort dropdown
    - Product cards: repeat(auto-fill, minmax(210px, 1fr))
    - Pagination: numbered, flat, active = black fill
```

**WooCommerce dynamic areas:**
- `{{shop.title}}` `{{shop.product_count}}` `{{archive.products}}`
- `{{filter.categories}}` `{{filter.price_range}}` `{{filter.tags}}`

---

### 3.3 `single-product` — Product Detail Page

```
[Navbar]
[Breadcrumb]
[Product Layout: auto 1fr | 0.8fr 1fr (thumbnail | main image | info)]
  Thumbnails (vertical strip, 58px wide):
    - Each thumb: 58×58, border 1px rule, active border = gold
    - Video thumb: dark bg + play icon
  Main image/video:
    - Tall aspect ratio, full bleed
    - Prev/Next arrows
    - Dot indicators
  Info panel:
    - Eyebrow (category)
    - H1 (Cormorant, clamp 1.625–2.375rem)
    - Star rating row
    - Price (clamp 1.5–2rem, weight 800, gold if sale)
    - Horizontal hairline divider
    - Color chips (if variants)
    - Strap chips
    - Quantity stepper
    - Buy Now (Primary, full-width)
    - Add to Cart + Wishlist row
    - Spec table (ruled rows, label/value pairs)
    - Trust strip (ruled, gold icons)
    - Description text (eyebrow + body copy)
[Related Products — H2 + grid]
[Reviews Section]
```

**WooCommerce dynamic tags:**
```
{{product.title}}          {{product.price}}
{{product.sale_price}}     {{product.discount_percent}}
{{product.rating}}         {{product.review_count}}
{{product.gallery}}        {{product.video}}
{{product.description}}    {{product.color_variants}}
{{product.strap_options}}  {{product.stock_status}}
{{product.movement}}       {{product.water_resistance}}
{{product.case_material}}  {{related.products}}
```

---

### 3.4 `cart` — Cart Page

```
[Navbar]
[H1 "Your Cart"]
[Two-column layout: Cart Table (fill) | Order Summary (320px)]
  Cart Table:
    - Header row: Product | Qty | Price
    - Item rows: image + name/variant | stepper | price | remove
    - Hairline rule between rows
    - Coupon code field + Apply btn
  Order Summary:
    - Surface panel (white, ruled top)
    - Subtotal / Shipping / COD Fee rows
    - Total (large, Cormorant)
    - Checkout CTA (Primary, full width)
    - Trust icons strip
```

---

### 3.5 `checkout` — Checkout Page

```
[Navbar (minimal — no cart)]
[Two-column layout: Form (fill) | Summary (360px)]
  Form sections (separated by hairlines + eyebrow labels):
    1. Contact Info — name, phone, email
    2. Shipping Address — address, city
    3. Payment Method — COD chip | Prepaid chip
  Summary panel:
    - Order items (thumbnail + name + price)
    - Totals table
    - Confirm Order btn (Primary, full width)
```

---

### 3.6 `404` — Not Found

```
[Navbar]
[Centered layout]
  - Large "404" in Cormorant Garamond, 8rem, muted
  - H2 "This page doesn't exist"
  - Body copy
  - CTA: Go to Homepage (Primary) + Shop (Outline)
```

---

### 3.7 `account-page` — Customer Dashboard

```
[Navbar]
[Sidebar: Account nav links — ruled left border active]
  - Profile / Orders / Wishlist / Addresses / Logout
[Main area: content panel for each section]
  Orders table: Order # | Date | Status badge | Total | View button
  Wishlist grid: Product cards
  Profile form: Input fields + Save btn
```

---

## 4. Developer Notes & WordPress Mapping

### 4.1 Block Boundary Reference

| Visual Section | WordPress Block / WooCommerce |
|----------------|-------------------------------|
| Hero Slider | `core/cover` or custom block |
| USP Strip | `core/columns` (4-col) |
| Product Grid | `woocommerce/product-grid` |
| Product Card | `woocommerce/product` template part |
| Cart Drawer | WooCommerce mini-cart widget |
| Filter Sidebar | WooCommerce product filter blocks |
| Reviews | `woocommerce/reviews` |
| Newsletter | MailPoet or FluentForms block |

### 4.2 WooCommerce Dynamic Field Tags

```
Product fields:
  {{product.id}}              → get_the_ID()
  {{product.title}}           → get_the_title()
  {{product.price}}           → wc_price(get_post_meta(id,'_price',true))
  {{product.sale_price}}      → wc_price($product->get_sale_price())
  {{product.regular_price}}   → wc_price($product->get_regular_price())
  {{product.image}}           → get_the_post_thumbnail_url()
  {{product.gallery}}         → $product->get_gallery_image_ids()
  {{product.rating}}          → $product->get_average_rating()
  {{product.review_count}}    → $product->get_review_count()
  {{product.stock_status}}    → $product->is_in_stock()
  {{product.categories}}      → wc_get_product_category_list(id)
  {{product.short_description}}→ $product->get_short_description()
  {{product.description}}     → $product->get_description()

Attributes (for color/strap variants):
  {{product.attribute.color}} → $product->get_attribute('pa_color')
  {{product.attribute.strap}} → $product->get_attribute('pa_strap')

Archive:
  {{archive.title}}           → woocommerce_page_title()
  {{archive.product_count}}   → $wp_query->found_posts
  {{archive.products}}        → WC_Query products loop

Cart:
  {{cart.count}}              → WC()->cart->get_cart_contents_count()
  {{cart.subtotal}}           → WC()->cart->get_cart_subtotal()
  {{cart.total}}              → WC()->cart->get_total()

Checkout:
  {{checkout.fields}}         → WooCommerce checkout form fields
  {{order.id}}                → $order->get_id()
  {{order.status}}            → $order->get_status()
```

### 4.3 CSS Custom Property → WordPress `theme.json` Mapping

| CSS Variable | `theme.json` slug | Gutenberg class |
|-------------|-------------------|-----------------|
| `--color-primary` | `primary` | `has-primary-background-color` |
| `--color-secondary` | `secondary` | `has-secondary-color` |
| `--color-background` | `background` | `has-background-background-color` |
| `--color-text-muted` | `text-muted` | `has-text-muted-color` |
| `--color-error` | `error` | — |
| `--radius` (2px) | maps to `radius/sm` | — |

### 4.4 Elementor / Bricks Global Variables

```css
/* Elementor Global Colors */
--e-global-color-primary:    #0F0E0C;
--e-global-color-secondary:  #C9A84C;
--e-global-color-text:       #0F0E0C;
--e-global-color-accent:     #A88A3A;

/* Elementor Global Fonts */
--e-global-typography-primary-font-family:   'Cormorant Garamond';
--e-global-typography-secondary-font-family: 'DM Sans';
--e-global-typography-text-font-family:      'DM Sans';

/* Bricks */
--bricks-color-heading: #0F0E0C;
--bricks-color-text:    #0F0E0C;
--bricks-color-muted:   #6B6B6B;
```

---

## 5. Figma Setup Checklist

### Variables (Figma Variables Panel)
- [ ] Create **Collection: Primitives** — raw hex values
- [ ] Create **Collection: Semantic** — alias references to Primitives
- [ ] Create **Collection: Spacing** — 8pt scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- [ ] Create **Collection: Radius** — none, sm (2px), md (4px), lg (8px), full
- [ ] Set all Semantic variables to reference Primitives (never raw hex in Semantic)

### Text Styles
- [ ] Display / Cormorant Garamond 700
- [ ] H1–H4 / Cormorant + DM Sans
- [ ] Body Large / Regular / Small
- [ ] Caption + Eyebrow
- [ ] Button / Button SM

### Effect Styles
- [ ] Rule (hairline)
- [ ] Shadow SM / MD
- [ ] Gold Focus Ring

### Component Structure
- [ ] Use **Auto Layout** on all components (Hug contents)
- [ ] Apply **Component Properties** for: hasDiscount, isInStock, isWishlisted, variant
- [ ] Use **Instance Swap** for badge type and icon
- [ ] All interactive states as **Variants** within each component set

---

*This design system is production-ready for handoff to WordPress theme development teams using Elementor, Bricks, or native Gutenberg block development.*
