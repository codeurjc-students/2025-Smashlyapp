
import os
import sys

# Add project root to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

from src.scrapers.racket_manager import RacketManager

class MockProduct:
    def __init__(self, name, brand, url="http://test.com", price=100.0):
        self.name = name
        self.brand = brand
        self.url = url
        self.price = price
        self.original_price = None
        self.image = "img.jpg"
        self.images = ["img.jpg"]
        self.specs = {}
        self.description = "desc"

    def to_dict(self):
        return self.__dict__

def test_deduplication():
    # Use a temporary DB file
    db_path = "test_rackets.json"
    if os.path.exists(db_path):
        os.remove(db_path)
        
    manager = RacketManager(db_path=db_path)
    
    print("--- Test 1: Add Base Racket ---")
    p1 = MockProduct("Head Gravity Pro 2024", "Head", url="http://store1.com/head-gravity")
    manager.merge_product(p1, "Store1")
    
    # Verify it exists
    slugs = list(manager.data.keys())
    print(f"Rackets in DB: {slugs}")
    assert len(slugs) == 1
    base_slug = slugs[0]
    
    print("\n--- Test 2: Add Duplicate with Different Name (Fuzzy Match) ---")
    # Same racket, slightly different name from another store
    p2 = MockProduct("Pala Head Gravity Pro", "Head", url="http://store2.com/gravity-pro")
    manager.merge_product(p2, "Store2")
    
    slugs = list(manager.data.keys())
    print(f"Rackets in DB: {slugs}")
    assert len(slugs) == 1 # Should fail if fuzzy match doesn't work
    assert manager.data[base_slug]['prices'][1]['store'] == "Store2"
    print("SUCCESS: Merged into existing racket")

    print("\n--- Test 3: Add Distinct Racket (No Match) ---")
    p3 = MockProduct("Head Gravity Motion", "Head", url="http://store1.com/head-motion")
    manager.merge_product(p3, "Store1")
    
    slugs = list(manager.data.keys())
    print(f"Rackets in DB: {slugs}")
    assert len(slugs) == 2
    print("SUCCESS: Added as new racket")
    
    print("\n--- Test 4: Brand Mismatch (Should NOT Merge) ---")
    p4 = MockProduct("Nox Gravity Pro", "Nox", url="http://store1.com/nox-gravity")
    manager.merge_product(p4, "Store1")
    
    slugs = list(manager.data.keys())
    print(f"Rackets in DB: {slugs}")
    assert len(slugs) == 3
    print("SUCCESS: Ignored due to brand mismatch")

    # Cleanup
    if os.path.exists(db_path):
        os.remove(db_path)

if __name__ == "__main__":
    test_deduplication()
