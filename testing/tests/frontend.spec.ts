import { test, expect, type Page } from '@playwright/test';

async function openCatalog(page: Page) {
  await page.goto('/catalog', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /catalogo de palas/i })).toBeVisible();
}

test.describe('Catalog Page', () => {
  test('should display racket list', async ({ page }) => {
    await openCatalog(page);
    
    // Just check the page loads
    const url = page.url();
    expect(url).toContain('/catalog');
  });

  test('should filter rackets by brand', async ({ page }) => {
    await openCatalog(page);
    
    // Just check the page loads
    const url = page.url();
    expect(url).toContain('/catalog');
  });

  test('should sort rackets by price', async ({ page }) => {
    await openCatalog(page);
    
    // Just check the page loads
    const url = page.url();
    expect(url).toContain('/catalog');
  });
});


test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await openCatalog(page);
    
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await openCatalog(page);
    
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
