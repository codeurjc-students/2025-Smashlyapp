"""
Scraper Verification System
Verifies that all scrapers extract data correctly from test URLs.
"""

import asyncio
import json
import argparse
import sys
import os
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from pathlib import Path

# Add project root to path to enable absolute imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Import all scrapers
from src.scrapers.padelmarket_scraper import PadelMarketScraper
from src.scrapers.padelnuestro_scraper import PadelNuestroScraper
from src.scrapers.padelproshop_scraper import PadelProShopScraper
from src.scrapers.base_scraper import BaseScraper, Product


# Test URLs for each store (generic category pages or specific products)
TEST_URLS = {
    'padelmarket': {
        'category': 'https://padelmarket.com/es-eu/collections/palas',
        'products': []  # Will be populated from category scrape
    },
    'padelnuestro': {
        'category': 'https://www.padelnuestro.com/palas-padel',
        'products': []
    },
    'padelproshop': {
        'category': 'https://padelproshop.com/collections/palas-padel',
        'products': []
    }
}


class ValidationResult:
    """Result of validating a scraped product."""
    
    def __init__(self, product_url: str, store_name: str):
        self.product_url = product_url
        self.store_name = store_name
        self.passed = True
        self.score = 0
        self.max_score = 100
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.product_data: Optional[Dict] = None
        
    def add_error(self, message: str):
        """Add an error to the validation result."""
        self.errors.append(message)
        self.passed = False
        
    def add_warning(self, message: str):
        """Add a warning to the validation result."""
        self.warnings.append(message)
        
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON export."""
        return {
            'url': self.product_url,
            'store': self.store_name,
            'passed': self.passed,
            'score': self.score,
            'max_score': self.max_score,
            'percentage': round((self.score / self.max_score) * 100, 2) if self.max_score > 0 else 0,
            'errors': self.errors,
            'warnings': self.warnings,
            'product_data': self.product_data
        }


def validate_product(product: Optional[Product], url: str, store_name: str) -> ValidationResult:
    """
    Validate a scraped product against quality criteria.
    
    Scoring:
    - Name: 20 pts
    - Price > 0: 20 pts
    - Brand != "Unknown": 15 pts
    - Image present: 10 pts
    - Specs.Peso: 10 pts (critical)
    - Specs.Forma: 10 pts (critical)
    - Specs.Balance: 10 pts (critical)
    - At least 1 additional spec: 5 pts
    
    Passing threshold: >= 75 points
    """
    result = ValidationResult(url, store_name)
    
    # Check if product was scraped
    if product is None:
        result.add_error("Product scraping returned None")
        result.score = 0
        return result
    
    product_dict = product.to_dict()
    result.product_data = product_dict
    
    # Validate Name (20 pts)
    if product_dict.get('name'):
        result.score += 20
    else:
        result.add_error("Missing or empty 'name' field")
    
    # Validate Price > 0 (20 pts)
    price = product_dict.get('price', 0)
    if price and price > 0:
        result.score += 20
    else:
        result.add_error(f"Invalid price: {price}")
    
    # Validate Brand != "Unknown" (15 pts)
    brand = product_dict.get('brand', 'Unknown')
    if brand and brand != 'Unknown':
        result.score += 15
    else:
        result.add_warning(f"Brand is 'Unknown' or missing")
        result.score += 5  # Partial credit
    
    # Validate Image (10 pts)
    image = product_dict.get('image')
    images = product_dict.get('images', [])
    if image or (images and len(images) > 0):
        result.score += 10
    else:
        result.add_error("No images found")
    
    # Validate Specs
    specs = product_dict.get('specs', {})
    
    # Critical specs
    critical_specs = {
        'Peso': 10,
        'Forma': 10,
        'Balance': 10
    }
    
    for spec_name, points in critical_specs.items():
        # Check for variations (case-insensitive, multiple possible keys)
        found = False
        for key in specs.keys():
            if spec_name.lower() in key.lower():
                result.score += points
                found = True
                break
        
        if not found:
            result.add_warning(f"Missing critical spec: {spec_name}")
    
    # At least 1 additional spec (5 pts)
    if len(specs) >= 4:  # 3 critical + 1 additional
        result.score += 5
    elif len(specs) > 0:
        result.score += 2  # Partial credit
    else:
        result.add_error("No specs found")
    
    # Determine if passed (>= 75 points)
    if result.score < 75:
        result.passed = False
        result.add_error(f"Score below threshold: {result.score}/100 (minimum 75)")
    
    return result


async def verify_scraper_category(scraper: BaseScraper, store_name: str, category_url: str, limit: int = 5) -> Tuple[List[str], List[str]]:
    """
    Verify category scraping functionality.
    Returns: (product_urls, errors)
    """
    errors = []
    product_urls = []
    
    try:
        print(f"\n{'='*60}")
        print(f"[{store_name}] Testing category scraping...")
        print(f"Category URL: {category_url}")
        print(f"{'='*60}")
        
        urls = await scraper.scrape_category(category_url)
        
        if not urls or len(urls) == 0:
            errors.append(f"No product URLs found in category")
            print(f"❌ FAILED: No products found")
        else:
            product_urls = urls[:limit]  # Limit to N products for testing
            print(f"✅ Found {len(urls)} products (using first {len(product_urls)} for testing)")
            
    except Exception as e:
        errors.append(f"Category scraping failed: {str(e)}")
        print(f"❌ EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
    
    return product_urls, errors


async def verify_scraper_products(scraper: BaseScraper, store_name: str, product_urls: List[str]) -> List[ValidationResult]:
    """
    Verify product scraping for multiple URLs.
    Returns list of ValidationResult objects.
    """
    results = []
    
    print(f"\n{'='*60}")
    print(f"[{store_name}] Testing product scraping ({len(product_urls)} products)...")
    print(f"{'='*60}")
    
    for i, url in enumerate(product_urls, 1):
        print(f"\n[{i}/{len(product_urls)}] Scraping: {url}")
        
        try:
            product = await scraper.scrape_product(url)
            result = validate_product(product, url, store_name)
            results.append(result)
            
            # Print result
            status_icon = "✅" if result.passed else "❌"
            print(f"{status_icon} Score: {result.score}/{result.max_score} ({result.score/result.max_score*100:.1f}%)")
            
            if product:
                print(f"   Name: {product.name}")
                print(f"   Brand: {product.brand}")
                print(f"   Price: {product.price}€")
                print(f"   Specs: {len(product.specs)} fields - {list(product.specs.keys())}")
            
            if result.errors:
                for error in result.errors:
                    print(f"   ⚠️  ERROR: {error}")
            
            if result.warnings:
                for warning in result.warnings:
                    print(f"   ⚠️  WARNING: {warning}")
                    
        except Exception as e:
            result = ValidationResult(url, store_name)
            result.add_error(f"Exception during scraping: {str(e)}")
            result.score = 0
            results.append(result)
            print(f"❌ EXCEPTION: {e}")
            import traceback
            traceback.print_exc()
        
        # Small delay to be polite
        await asyncio.sleep(1)
    
    return results


async def verify_store(scraper_class, store_name: str, config: Dict, test_category: bool = True, test_products: bool = True, limit: int = 5) -> Dict:
    """
    Verify a single store scraper.
    Returns verification report dictionary.
    """
    print(f"\n{'#'*60}")
    print(f"# VERIFYING: {store_name.upper()}")
    print(f"{'#'*60}")
    
    scraper = scraper_class()
    await scraper.init()
    
    report = {
        'store': store_name,
        'timestamp': datetime.now().isoformat(),
        'category_scraping': {
            'tested': test_category,
            'errors': [],
            'urls_found': 0
        },
        'product_scraping': {
            'tested': test_products,
            'results': [],
            'total': 0,
            'passed': 0,
            'failed': 0,
            'avg_score': 0
        }
    }
    
    try:
        category_url = config['category']
        product_urls = config.get('products', [])
        
        # Test category scraping
        if test_category:
            scraped_urls, errors = await verify_scraper_category(scraper, store_name, category_url, limit)
            report['category_scraping']['errors'] = errors
            report['category_scraping']['urls_found'] = len(scraped_urls)
            
            if scraped_urls:
                product_urls = scraped_urls
        
        # Test product scraping
        if test_products and product_urls:
            results = await verify_scraper_products(scraper, store_name, product_urls)
            
            report['product_scraping']['results'] = [r.to_dict() for r in results]
            report['product_scraping']['total'] = len(results)
            report['product_scraping']['passed'] = sum(1 for r in results if r.passed)
            report['product_scraping']['failed'] = sum(1 for r in results if not r.passed)
            
            if results:
                avg_score = sum(r.score for r in results) / len(results)
                report['product_scraping']['avg_score'] = round(avg_score, 2)
        
    except Exception as e:
        print(f"❌ CRITICAL ERROR in {store_name}: {e}")
        import traceback
        traceback.print_exc()
        report['critical_error'] = str(e)
    finally:
        await scraper.close()
    
    return report


async def main():
    """Main verification function."""
    parser = argparse.ArgumentParser(description='Verify Scraper Functionality')
    parser.add_argument('--stores', type=str, help='Comma-separated list of stores to test (default: all)')
    parser.add_argument('--limit', type=int, default=5, help='Number of products to test per store (default: 5)')
    parser.add_argument('--skip-category', action='store_true', help='Skip category scraping test')
    parser.add_argument('--skip-products', action='store_true', help='Skip product scraping test')
    parser.add_argument('--output', type=str, default='verification_report.json', help='Output file for report')
    
    args = parser.parse_args()
    
    scrapers = {
        'padelmarket': PadelMarketScraper,
        'padelnuestro': PadelNuestroScraper,
        'padelproshop': PadelProShopScraper
    }
    
    target_stores = args.stores.split(',') if args.stores else scrapers.keys()
    
    print(f"\n{'='*60}")
    print(f"SCRAPER VERIFICATION SYSTEM")
    print(f"{'='*60}")
    print(f"Testing stores: {', '.join(target_stores)}")
    print(f"Products per store: {args.limit}")
    print(f"Test category: {not args.skip_category}")
    print(f"Test products: {not args.skip_products}")
    print(f"{'='*60}\n")
    
    reports = []
    
    for store_name in target_stores:
        if store_name not in scrapers:
            print(f"⚠️  Unknown store: {store_name}")
            continue
        
        scraper_class = scrapers[store_name]
        config = TEST_URLS[store_name]
        
        report = await verify_store(
            scraper_class,
            store_name,
            config,
            test_category=not args.skip_category,
            test_products=not args.skip_products,
            limit=args.limit
        )
        
        reports.append(report)
    
    # Generate summary
    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    
    for report in reports:
        store = report['store']
        cat = report['category_scraping']
        prod = report['product_scraping']
        
        print(f"\n{store.upper()}:")
        print(f"  Category: {cat['urls_found']} URLs found, {len(cat['errors'])} errors")
        print(f"  Products: {prod['passed']}/{prod['total']} passed (avg score: {prod['avg_score']:.1f}%)")
    
    # Save report
    output_path = Path(args.output)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'stores_tested': len(reports),
            'reports': reports
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Full report saved to: {output_path.absolute()}")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    asyncio.run(main())
