import { expect, test, type Page } from '@playwright/test';

const product = {
  id: 'e2e-watch',
  slug: 'e2e-watch',
  name: 'Test Chronograph',
  brand: 'StarkBuy',
  category: 'Chronograph',
  gender: 'Unisex',
  caseSizeOptions: ['42mm'],
  strapOptions: ['Leather'],
  codPrice: 10_000,
  discountPercent: 10,
  image: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
  gallery: [],
  inStock: true,
  stock: {},
  newArrival: false,
  featured: true,
  flashSale: false,
  limited: false,
  rating: 5,
  reviewCount: 1,
  unitsSold: 1,
  description: 'Test watch',
  movement: 'Quartz',
  caseMaterial: 'Steel',
  waterResistance: '3 ATM',
};

async function prepareCheckout(page: Page) {
  await page.route('**/rest/v1/site_config*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{}',
  }));
  await page.route('**/rest/v1/product_reviews*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route('**/rest/v1/rpc/place_order', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      subtotal: 9_000,
      shipping: 250,
      cod_fee: 0,
      discount: 0,
      total: 9_250,
      items: [],
    }),
  }));
  await page.route('**/functions/v1/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{}',
  }));
  await page.addInitScript(item => {
    localStorage.setItem('starkbuy_cart', JSON.stringify([{
      product: item,
      caseSize: '42mm',
      strap: 'Leather',
      quantity: 1,
    }]));
  }, product);
  await page.goto('/checkout');
}

test('shopper can complete a cash-on-delivery checkout', async ({ page }) => {
  await prepareCheckout(page);

  await page.getByLabel('Full name *').fill('Ayesha Khan');
  await page.getByLabel('Phone number *').fill('03001234567');
  await page.getByLabel('Email * (for order confirmation)').fill('ayesha@example.com');
  await page.getByRole('button', { name: 'Continue to Shipping' }).click();

  await page.getByLabel('Street address *').fill('12 Mall Road');
  await page.getByLabel('City *').fill('Lahore');
  await page.getByRole('button', { name: 'Place Order (COD)' }).click();

  await expect(page.getByText('Order confirmed')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Thank you, Ayesha' })).toBeVisible();
  await expect(page.getByText(/confirmation has been sent to ayesha@example.com/)).toBeVisible();
});

test('checkout has labelled controls and meaningful image alternatives', async ({ page }) => {
  await prepareCheckout(page);

  await expect(page.getByRole('heading', { name: 'Contact details' })).toBeVisible();

  const unlabelledInputs = await page.locator('input').evaluateAll(inputs => inputs.filter(input => {
    const labels = input.labels;
    return !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby') && !labels?.length;
  }).length);
  expect(unlabelledInputs).toBe(0);

  const imagesWithoutAlt = await page.locator('img').evaluateAll(
    images => images.filter(image => !image.hasAttribute('alt')).length,
  );
  expect(imagesWithoutAlt).toBe(0);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
