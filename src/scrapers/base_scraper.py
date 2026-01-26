from abc import ABC, abstractmethod
from typing import Dict, Optional, List
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
import asyncio


class Product:
    """Represents a scraped product with all its attributes."""

    def __init__(
        self,
        url: str,
        name: str,
        price: float,
        brand: str,
        image: str,
        specs: Dict[str, str],
        original_price: Optional[float] = None,
        description: Optional[str] = None,
        images: Optional[List[str]] = None
    ):
        self.url = url
        self.name = name
        self.price = price
        self.original_price = original_price
        self.brand = brand
        self.image = image
        self.images = images or [image] if image else []
        self.specs = specs
        self.description = description

    def to_dict(self) -> dict:
        """Convert product to dictionary."""
        return {
            "url": self.url,
            "name": self.name,
            "price": self.price,
            "originalPrice": self.original_price,
            "brand": self.brand,
            "brand": self.brand,
            "image": self.image,
            "images": self.images,
            "specs": self.specs,
            "description": self.description
        }


class BaseScraper(ABC):
    """Abstract base class for all scrapers."""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None

    async def init(self):
        """Initialize the browser with Spanish locale settings."""
        if not self.browser:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(headless=True)
            self.context = await self.browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                locale='es-ES'
            )
            self.page = await self.context.new_page()

    async def close(self):
        """Close the browser and cleanup resources."""
        if self.browser:
            await self.browser.close()
            self.browser = None
            self.context = None
            self.page = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None

    async def get_page(self, url: str) -> Page:
        """Get or navigate to a specific page."""
        if not self.page:
            await self.init()

        if self.page.url != url:
            await self.page.goto(url, wait_until='domcontentloaded', timeout=30000)

        return self.page

    @abstractmethod
    async def scrape_product(self, url: str) -> Product:
        """Scrape a product from the given URL. Must be implemented by subclasses."""
        pass

    @abstractmethod
    async def scrape_category(self, url: str) -> List[str]:
        """Scrape product URLs from a category page. Must be implemented by subclasses."""
        pass
