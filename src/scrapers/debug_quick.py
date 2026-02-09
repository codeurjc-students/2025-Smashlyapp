import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.scrapers.padelmarket_scraper import PadelMarketScraper

async def debug():
    scraper = PadelMarketScraper()
    await scraper.init()
    
    try:
        page = await scraper.get_page("https://padelmarket.com/collections/palas")
        
        # Close popups
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(500)
        
        await page.evaluate("""() => {
            const klaviyoClose = document.querySelector('.needsclick button[aria-label="Close"]');
            if (klaviyoClose) klaviyoClose.click();
            
            const overlays = document.querySelectorAll('[role="dialog"], .klaviyo-form, .kl-private-reset-css-Xuajs1');
            overlays.forEach(el => el.remove());
            
            const cookieClose = document.querySelector('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
            if (cookieClose) cookieClose.click();
        }""")
        await page.wait_for_timeout(500)
        
        # Wait for products to load
        print("Waiting for products to appear...")
        await page.wait_for_timeout(3000)  # Give it time
        
        # Try to find products
        links = await page.query_selector_all('a[href*="/products/"]')
        print(f"Found {len(links)} product links")
        
        if len(links) > 0:
            # Show first 3
            for i, link in enumerate(links[:3]):
                href = await link.get_attribute('href')
                print(f"  {i+1}. {href}")
        else:
            print("No products found! Let's check the page...")
            
            # Save screenshot
            await page.screenshot(path="c:/Users/teije/Documents/Proyectos/2025-Smashlyapp/src/scrapers/debug_page.png")
            print("Screenshot saved to debug_page.png")
            
            # Check for load more button
            load_more = await page.query_selector('button.load-more')
            print(f"Load More button exists: {load_more is not None}")
            if load_more:
                visible = await load_more.is_visible()
                print(f"Load More visible: {visible}")
        
    finally:
        await scraper.close()

if __name__ == "__main__":
    asyncio.run(debug())
