#!/usr/bin/env python3
"""
Debug script to test TiendaPadelPoint price extraction
"""
import asyncio
import sys
import os

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from tiendapadelpoint_scraper import TiendaPadelPointScraper
from base_scraper import clean_price

async def test_price_extraction():
    scraper = TiendaPadelPointScraper()
    await scraper.init()
    
    # Test URL from verification report
    url = 'https://www.tiendapadelpoint.com/flash-point---ofertas-palas-padel-y-ropa/pala-bullpadel-juan-martin-diaz-icon-2025-1-1'
    
    print(f"Testing URL: {url}\n")
    
    page = await scraper.get_page(url)
    
    # Get raw price text from different selectors
    print("=== Raw Price Text ===")
    new_p_text = await scraper.safe_get_text('.product-info .price-new')
    print(f'Selector ".product-info .price-new": {repr(new_p_text)}')
    
    old_p_text = await scraper.safe_get_text('.product-info .price-old')
    print(f'Selector ".product-info .price-old": {repr(old_p_text)}')
    
    alt_text = await scraper.safe_get_text('.product-info .product-price')
    print(f'Selector ".product-info .product-price": {repr(alt_text)}')
    
    price_text = await scraper.safe_get_text('.product-info li h2')
    print(f'Selector ".product-info li h2": {repr(price_text)}')
    
    price_plain = await scraper.safe_get_text('.product-info .price')
    print(f'Selector ".product-info .price": {repr(price_plain)}')
    
    # Test clean_price function
    print("\n=== clean_price() Results ===")
    if new_p_text:
        result = clean_price(new_p_text)
        print(f'clean_price({repr(new_p_text)}) = {result}')
    
    if old_p_text:
        result = clean_price(old_p_text)
        print(f'clean_price({repr(old_p_text)}) = {result}')
    
    # Test cases for clean_price
    print("\n=== Testing clean_price() with different formats ===")
    test_cases = [
        "149,95 €",
        "14995",
        "149.95",
        "277,95 €",
        "27795"
    ]
    
    for test in test_cases:
        result = clean_price(test)
        print(f'clean_price({repr(test)}) = {result}')
    
    await scraper.close()

if __name__ == "__main__":
    asyncio.run(test_price_extraction())
