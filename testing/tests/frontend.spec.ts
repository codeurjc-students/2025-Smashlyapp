import { test, expect } from '@playwright/test';
import { MainPage, CatalogPage, LoginPage } from '../pages/MainPage';

test.describe('Frontend E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Main Page', () => {
    test('should load main page successfully', async ({ page }) => {
      const mainPage = new MainPage(page);
      
      await mainPage.navigateTo('/catalog');
      await mainPage.waitForPageLoad();

      expect(mainPage.getCurrentUrl()).toContain('/catalog');
      
      const title = await mainPage.getPageTitle();
      expect(title).toBeTruthy();
    });

    test('should display search functionality', async ({ page }) => {
      const mainPage = new MainPage(page);
      
      await mainPage.navigateTo('/catalog');
      await mainPage.waitForPageLoad();
      
      await mainPage.search('BULLPADEL');
      
      await page.waitForLoadState('networkidle');
      expect(mainPage.getCurrentUrl()).toContain('search');
    });

    test('should navigate to catalog', async ({ page }) => {
      const mainPage = new MainPage(page);
      
      await mainPage.catalogLink.click();
      await mainPage.waitForPageLoad();
      
      const catalogPage = new CatalogPage(page);
      await catalogPage.waitForRackets();
    });
  });

  test.describe('Catalog Page', () => {
    test('should display racket list', async ({ page }) => {
      const catalogPage = new CatalogPage(page);
      
      await page.goto('/catalog');
      await catalogPage.waitForRackets();
      
      const count = await catalogPage.getRacketCount();
      expect(count).toBeGreaterThan(0);
    });

    test('should filter rackets by brand', async ({ page }) => {
      const catalogPage = new CatalogPage(page);
      
      await page.goto('/catalog');
      await catalogPage.waitForRackets();
      
      const initialCount = await catalogPage.getRacketCount();
      
      await catalogPage.filterByBrand('BULLPADEL');
      await page.waitForLoadState('networkidle');
      
      const filteredCount = await catalogPage.getRacketCount();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test('should sort rackets by price', async ({ page }) => {
      const catalogPage = new CatalogPage(page);
      
      await page.goto('/catalog');
      await catalogPage.waitForRackets();
      
      await catalogPage.sortBy('price_asc');
      await page.waitForLoadState('networkidle');
      
      const count = await catalogPage.getRacketCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Authentication', () => {
    test('should show login form', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await page.goto('/login');
      
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await page.goto('/login');
      await loginPage.login('invalid@test.com', 'wrongpassword');
      
      const error = await loginPage.getErrorMessage();
      expect(error).toBeTruthy();
    });

    test('should login with Google', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await page.goto('/login');
      await loginPage.loginWithGoogle();
      
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/catalog');
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      expect(title).toBeTruthy();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/catalog');
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      expect(title).toBeTruthy();
    });
  });
});
