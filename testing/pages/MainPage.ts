import { Page, Locator } from '@playwright/test';

export class MainPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly catalogLink: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder('Buscar palas...');
    this.catalogLink = page.getByRole('link', { name: /catálogo/i });
    this.loadingSpinner = page.locator('.loading, .spinner');
  }

  async navigateTo(path: string) {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}

export class CatalogPage {
  readonly page: Page;
  readonly racketCards: Locator;
  readonly filterBrand: Locator;
  readonly filterShape: Locator;
  readonly sortDropdown: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.racketCards = page.locator('[class*="racket"], [class*="product"], .card');
    this.filterBrand = page.locator('[class*="filter"] select, [class*="filter"] input').first();
    this.filterShape = page.locator('[class*="filter"]').nth(1);
    this.sortDropdown = page.locator('[class*="sort"] select');
    this.noResultsMessage = page.locator('[class*="no-results"], [class*="empty"]');
  }

  async waitForRackets() {
    await this.racketCards.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async getRacketCount(): Promise<number> {
    return this.racketCards.count();
  }

  async filterByBrand(brand: string) {
    await this.filterBrand.selectOption(brand);
  }

  async sortBy(field: string) {
    await this.sortDropdown.selectOption(field);
  }
}

export class RacketDetailPage {
  readonly page: Page;
  readonly racketName: Locator;
  readonly racketPrice: Locator;
  readonly addToListButton: Locator;
  readonly addToCompareButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.racketName = page.locator('h1, [class*="name"]');
    this.racketPrice = page.locator('[class*="price"]');
    this.addToListButton = page.getByRole('button', { name: /añadir a lista|add to list/i });
    this.addToCompareButton = page.getByRole('button', { name: /comparar|compare/i });
    this.backButton = page.getByRole('button', { name: /volver|back/i });
  }

  async getRacketName(): Promise<string> {
    return this.racketName.textContent() || '';
  }

  async getRacketPrice(): Promise<string> {
    return this.racketPrice.textContent() || '';
  }

  async addToComparisonList() {
    await this.addToCompareButton.click();
  }
}

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly googleLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/correo|email/i);
    this.passwordInput = page.getByLabel(/contraseña|password/i);
    this.submitButton = page.getByRole('button', { name: /iniciar sesión|login|entrar/i });
    this.errorMessage = page.locator('[class*="error"]');
    this.googleLoginButton = page.getByRole('button', { name: /google/i });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginWithGoogle() {
    await this.googleLoginButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return this.errorMessage.textContent() || '';
  }
}

export class ComparePage {
  readonly page: Page;
  readonly compareTable: Locator;
  readonly removeButton: Locator;
  readonly clearAllButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.compareTable = page.locator('[class*="compare"]');
    this.removeButton = page.getByRole('button', { name: /eliminar|remove/i });
    this.clearAllButton = page.getByRole('button', { name: /borrar todo|clear all/i });
  }

  async waitForComparison() {
    await this.compareTable.waitFor({ state: 'visible' });
  }

  async removeRacket(index: number) {
    await this.removeButton.nth(index).click();
  }

  async clearAll() {
    await this.clearAllButton.click();
  }
}

export class ListPage {
  readonly page: Page;
  readonly listItems: Locator;
  readonly createListButton: Locator;
  readonly deleteListButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.listItems = page.locator('[class*="list-item"], [class*="item"]');
    this.createListButton = page.getByRole('button', { name: /crear lista|create list/i });
    this.deleteListButton = page.getByRole('button', { name: /eliminar lista|delete list/i });
  }

  async createList(name: string) {
    await this.createListButton.click();
    await this.page.getByLabel(/nombre|name/i).fill(name);
    await this.page.getByRole('button', { name: /guardar|save/i }).click();
  }

  async deleteList(index: number) {
    await this.deleteListButton.nth(index).click();
  }
}
