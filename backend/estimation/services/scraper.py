"""
Web scraper for Pakistani construction material rates.
Sources: materialrate.pk, web search aggregation, manual fallbacks.
"""
import requests
from bs4 import BeautifulSoup
import re
import logging
from decimal import Decimal
from estimation.models import Material

logger = logging.getLogger(__name__)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}


def _extract_price_from_text(text, patterns):
    """
    Extract a numeric price from text using a list of regex patterns.
    Returns the first match found, or None.
    """
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                price_str = match.group(1).replace(',', '').strip()
                return float(price_str)
            except (ValueError, IndexError):
                continue
    return None


def _extract_price_range(text, patterns):
    """
    Extract a price range from text and return the average.
    Patterns should capture two groups (low, high).
    """
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                low = float(match.group(1).replace(',', '').strip())
                high = float(match.group(2).replace(',', '').strip())
                return round((low + high) / 2)
            except (ValueError, IndexError):
                continue
    return None


def scrape_materialrate_pk():
    """
    Scrapes materialrate.pk for current construction material rates.
    This site has text-based pricing info that we can extract.
    Returns dict of {material_id: rate} and list of failed items.
    """
    scraped_rates = {}
    failed_items = []

    # === CEMENT ===
    try:
        resp = requests.get('https://materialrate.pk/cement-rate-today/', headers=HEADERS, timeout=15)
        resp.raise_for_status()
        text = resp.text
        soup = BeautifulSoup(text, 'html.parser')
        page_text = soup.get_text(separator=' ')

        # Try to extract from tables first (wp-block-table or similar)
        cement_rate = None
        for table in soup.find_all('table'):
            table_text = table.get_text(separator=' ')
            if 'white' in table_text.lower():
                continue
            if not any(brand in table_text for brand in ['Lucky', 'DG Khan', 'Maple Leaf', 'Bestway', 'Fauji', 'Cherat']):
                continue
            # Look for brand rows with prices
            rate_match = re.findall(r'(?:Rs\.?\s*|PKR\s*|₨\s*)(\d[\d,]*)', table_text, re.IGNORECASE)
            if rate_match:
                rates = [float(r.replace(',', '')) for r in rate_match if 800 < float(r.replace(',', '')) < 3000]
                if rates:
                    cement_rate = round(sum(rates) / len(rates))
                    break

        # Fallback: extract from page text
        if not cement_rate:
            cement_rate = _extract_price_range(page_text, [
                r'PKR\s*(\d[\d,]*)\s*[-–to]+\s*(\d[\d,]*)\s*(?:per\s*(?:50\s*kg\s*)?bag)',
                r'Rs\.?\s*(\d[\d,]*)\s*[-–to]+\s*(\d[\d,]*)',
                r'around\s+PKR\s*(\d[\d,]*)\s*[-–to]+\s*(\d[\d,]*)',
            ])

        if not cement_rate:
            cement_rate = _extract_price_from_text(page_text, [
                r'cement.*?(?:Rs\.?\s*|PKR\s*|₨\s*)(\d[\d,]*)\s*(?:per\s*bag)',
                r'(?:Rs\.?\s*|PKR\s*|₨\s*)(\d[\d,]*)\s*per\s*(?:50\s*kg\s*)?bag',
            ])

        if cement_rate and 1000 < cement_rate < 3000:
            scraped_rates['cement-opc-43'] = cement_rate
            # OPC 53 is typically 3-5% more expensive
            scraped_rates['cement-opc-53'] = round(cement_rate * 1.04)
            logger.info(f"Scraped cement rate: {cement_rate}")
        else:
            failed_items.append('Cement OPC 43')
            failed_items.append('Cement OPC 53')

    except Exception as e:
        logger.error(f"Failed to scrape MaterialRate cement: {e}")
        failed_items.extend(['Cement OPC 43', 'Cement OPC 53'])

    # === STEEL ===
    try:
        resp = requests.get('https://materialrate.pk/steel-price-in-pakistan/', headers=HEADERS, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        page_text = soup.get_text(separator=' ')

        # Try table extraction
        steel_40 = None
        steel_60 = None

        for table in soup.find_all('table'):
            table_text = table.get_text(separator=' ')
            # Look for grade-specific rates
            match_40 = re.search(r'(?:40[\s-]*Grade|Grade[\s-]*40).*?(?:Rs\.?\s*|PKR\s*|₨\s*)(\d[\d,]*)\s*/?\s*kg', table_text, re.IGNORECASE | re.DOTALL)
            match_60 = re.search(r'(?:60[\s-]*Grade|Grade[\s-]*60).*?(?:Rs\.?\s*|PKR\s*|₨\s*)(\d[\d,]*)\s*/?\s*kg', table_text, re.IGNORECASE | re.DOTALL)
            if match_40:
                steel_40 = float(match_40.group(1).replace(',', ''))
            if match_60:
                steel_60 = float(match_60.group(1).replace(',', ''))

        # Fallback: extract from page text
        if not steel_40:
            steel_40 = _extract_price_from_text(page_text, [
                r'(?:Rs\.?\s*|PKR\s*|₨\s*)(\d[\d,]*)\s*/?\s*kg\s*\(?40[\s-]*Grade\)?',
                r'40[\s-]*Grade.*?(?:Rs\.?\s*|PKR\s*|₨\s*)(\d[\d,]*)\s*/?\s*kg',
            ])
        if not steel_60:
            steel_60 = _extract_price_from_text(page_text, [
                r'(?:Rs\.?\s*|PKR\s*|₨\s*)(\d[\d,]*)\s*/?\s*kg\s*\(?60[\s-]*Grade\)?',
                r'60[\s-]*Grade.*?(?:Rs\.?\s*|PKR\s*|₨\s*)(\d[\d,]*)\s*/?\s*kg',
            ])

        if steel_40 and 150 < steel_40 < 500:
            # Add tax, retail markup and carriage to get the delivered retail price (typically Rs. 20/kg markup)
            scraped_rates['steel-grade-40'] = round(steel_40 + 20)
            logger.info(f"Scraped steel Grade 40 (with retail markup): {scraped_rates['steel-grade-40']}")
        else:
            failed_items.append('Steel Grade 40')

        if steel_60 and 150 < steel_60 < 500:
            # Add tax, retail markup and carriage to get the delivered retail price (typically Rs. 20/kg markup)
            scraped_rates['steel-grade-60'] = round(steel_60 + 20)
            logger.info(f"Scraped steel Grade 60 (with retail markup): {scraped_rates['steel-grade-60']}")
        else:
            failed_items.append('Steel Grade 60')

    except Exception as e:
        logger.error(f"Failed to scrape MaterialRate steel: {e}")
        failed_items.extend(['Steel Grade 40', 'Steel Grade 60'])

    # === BRICKS ===
    try:
        resp = requests.get('https://materialrate.pk/brick-price-in-pakistan/', headers=HEADERS, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        page_text = soup.get_text(separator=' ')

        # Scrape Awwal brick price (per piece)
        brick_match = re.search(r'A-Class\s*\(Awwal.*?(?:Rs\.?|PKR|₨)\s*(\d+\.?\d*)', page_text, re.IGNORECASE)
        fly_ash_match = re.search(r'Fly\s*Ash\s*Bricks.*?(?:Rs\.?|PKR|₨)\s*(\d+\.?\d*)', page_text, re.IGNORECASE)

        if brick_match:
            brick_rate = float(brick_match.group(1))
            # Ex-kiln rate needs carriage/delivery markup (typically Rs. 2.50 per brick)
            scraped_rates['brick-solid'] = round(brick_rate + 2.50)
            logger.info(f"Scraped Awwal brick rate (with delivery): {scraped_rates['brick-solid']}")
            
            if fly_ash_match:
                fly_ash_rate = float(fly_ash_match.group(1))
                # Fly ash ex-kiln rate needs carriage/delivery markup (typically Rs. 3.50 per brick to reach medium delivered rate)
                scraped_rates['brick-fly-ash'] = round(fly_ash_rate + 3.50)
                logger.info(f"Scraped fly ash brick rate (with delivery): {scraped_rates['brick-fly-ash']}")
            else:
                scraped_rates['brick-fly-ash'] = round(scraped_rates['brick-solid'] * 0.95)  # fallback
        else:
            failed_items.append('Bricks')

    except Exception as e:
        logger.error(f"Failed to scrape MaterialRate bricks: {e}")
        failed_items.append('Bricks')

    # === SAND ===
    try:
        resp = requests.get('https://materialrate.pk/sand-price-in-pakistan/', headers=HEADERS, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        page_text = soup.get_text(separator=' ')

        chenab_match = re.search(r'Chenab\s*Sand.*?(?:Rs\.?|PKR|₨)\s*(\d+)\s*[-–]\s*(\d+)', page_text, re.IGNORECASE)
        lawrencepur_match = re.search(r'Lawrencepur\s*Sand.*?(?:Rs\.?|PKR|₨)\s*(\d+)\s*[-–]\s*(\d+)', page_text, re.IGNORECASE)

        sand_rate = None
        if lawrencepur_match:
            # Lawrencepur sand is premium, clean and coarser, excellent for concrete structures.
            low, high = float(lawrencepur_match.group(1)), float(lawrencepur_match.group(2))
            sand_rate = (low + high) / 2
            # Add delivery carriage markup if the rate represents raw ex-quarry prices
            if sand_rate < 80:
                sand_rate += 20
        elif chenab_match:
            # Chenab sand is mid-range, adding carriage markup
            low, high = float(chenab_match.group(1)), float(chenab_match.group(2))
            sand_rate = ((low + high) / 2) + 40

        if sand_rate and 30 < sand_rate < 300:
            scraped_rates['sand'] = round(sand_rate)
            logger.info(f"Scraped sand rate: {sand_rate}")
        else:
            failed_items.append('Sand')

    except Exception as e:
        logger.error(f"Failed to scrape MaterialRate sand: {e}")
        failed_items.append('Sand')

    # === CRUSH / BAJRI ===
    try:
        resp = requests.get('https://materialrate.pk/bajri-price-in-pakistan/', headers=HEADERS, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        page_text = soup.get_text(separator=' ')

        # Margalla 3 soter rate is the premium standard for structural concrete (RCC slabs, columns)
        margalla_3_match = re.search(r'3\s*Soter\s*[-–]\s*1\s*Cubic\s*Feet\s*(?:Rs\.?|PKR|₨)\s*(\d+)', page_text, re.IGNORECASE)
        margalla_2_match = re.search(r'2\s*Soter\s*[-–]\s*1\s*Cubic\s*Feet\s*(?:Rs\.?|PKR|₨)\s*(\d+)', page_text, re.IGNORECASE)

        crush_rate = None
        if margalla_3_match:
            crush_rate = float(margalla_3_match.group(1))
        elif margalla_2_match:
            crush_rate = float(margalla_2_match.group(1))

        if crush_rate and 50 < crush_rate < 400:
            scraped_rates['crush'] = round(crush_rate)
            logger.info(f"Scraped crush rate: {crush_rate}")
        else:
            failed_items.append('Crush')

    except Exception as e:
        logger.error(f"Failed to scrape MaterialRate crush: {e}")
        failed_items.append('Crush')

    return scraped_rates, failed_items


def get_fallback_rates():
    """
    Verified baseline rates — June 2026 Lahore market averages.
    Updated from multiple sources: materialrate.pk, hamariweb, web research.
    These are used as fallback when scraping fails.
    """
    return {
        # Gray structure materials
        'foundation-concrete': 400,
        'brick-solid': 17,
        'brick-fly-ash': 19,
        'cement-opc-43': 1550,
        'cement-opc-53': 1610,
        'steel-grade-40': 258,
        'steel-grade-60': 275,
        'sand': 95,
        'crush': 135,
        'plaster-cement': 70,
        'plaster-gypsum': 90,
        'roof-slab-pouring': 50,
        'waterproofing': 50,
        'shuttering': 28,

        # Finishing materials
        'floor-tiles-standard': 300,
        'floor-tiles-good': 400,
        'floor-tiles-premium': 650,
        'paint-standard': 55,
        'paint-good': 110,
        'paint-premium': 190,
        'wall-tiles-standard': 240,
        'wall-tiles-good': 380,
        'wall-tiles-premium': 550,
        'doors-standard': 25000,
        'doors-good': 32000,
        'doors-premium': 50000,
        'windows-standard': 1300,
        'windows-good': 2000,
        'windows-premium': 2800,
        'electrical-standard': 25000,
        'electrical-good': 38000,
        'electrical-premium': 60000,
        'plumbing-standard': 50000,
        'plumbing-good': 70000,
        'sanitary-standard': 70000,
        'sanitary-good': 120000,
        'sanitary-premium': 270000,
        'cabinets-standard': 2000,
        'cabinets-good': 3200,
        'cabinets-premium': 5000,

        # Quick Estimate per-sqft rates (gray structure)
        'quick-estimate-economy': 2800,
        'quick-estimate-standard': 3500,
        'quick-estimate-premium': 4500,
        'quick-estimate-luxury': 6000,
    }


def perform_market_sync():
    """
    Master function to coordinate scraping, apply fallbacks, and update the database.
    """
    updated_count = 0
    scraped_data, failed_items = scrape_materialrate_pk()
    fallback_data = get_fallback_rates()

    # Ensure quick estimate rate materials exist in the DB
    _ensure_quick_estimate_materials(fallback_data)

    # We will iterate over all active materials in the database.
    materials = Material.objects.filter(is_active=True)

    locked_count = 0
    for material in materials:
        # Skip locked materials — admin has explicitly frozen their price
        if material.is_price_locked:
            locked_count += 1
            logger.info(f"Skipping locked material: {material.name} (rate: {material.rate})")
            continue

        new_rate = None

        # 1. Try to use Live Scraped Data
        if material.id in scraped_data:
            new_rate = scraped_data[material.id]

        # 2. Fallback to our baseline if scraping failed for this specific item
        elif material.id in fallback_data:
            new_rate = fallback_data[material.id]

        else:
            # Custom material not in our scraping list or fallback
            continue

        if new_rate is not None and float(material.rate) != float(new_rate):
            old_rate = material.rate
            material.rate = Decimal(str(new_rate))
            material.save()
            updated_count += 1
            logger.info(f"Updated {material.name}: {old_rate} -> {new_rate}")

    scraped_count = len(scraped_data)
    return {
        "status": "success" if updated_count > 0 else "no_changes",
        "updated_count": updated_count,
        "scraped_count": scraped_count,
        "locked_count": locked_count,
        "failed_items": list(set(failed_items)),
        "scraped_items": list(scraped_data.keys()),
    }


def _ensure_quick_estimate_materials(fallback_data):
    """
    Ensure the quick estimate per-sqft rate entries exist in the Material table.
    These are stored like regular materials so the admin can view/edit/lock them.
    """
    quick_estimate_entries = [
        {
            'id': 'quick-estimate-economy',
            'name': 'Quick Estimate: Economy Rate',
            'category': 'other',
            'quality': 'standard',
            'unit': 'per sqft',
            'rate': fallback_data.get('quick-estimate-economy', 2800),
            'description': 'Per sq ft gray structure rate for economy quality construction (basic materials).',
        },
        {
            'id': 'quick-estimate-standard',
            'name': 'Quick Estimate: Standard Rate',
            'category': 'other',
            'quality': 'standard',
            'unit': 'per sqft',
            'rate': fallback_data.get('quick-estimate-standard', 3500),
            'description': 'Per sq ft gray structure rate for standard quality construction.',
        },
        {
            'id': 'quick-estimate-premium',
            'name': 'Quick Estimate: Premium Rate',
            'category': 'other',
            'quality': 'good',
            'unit': 'per sqft',
            'rate': fallback_data.get('quick-estimate-premium', 4500),
            'description': 'Per sq ft gray structure rate for premium quality construction.',
        },
        {
            'id': 'quick-estimate-luxury',
            'name': 'Quick Estimate: Luxury Rate',
            'category': 'other',
            'quality': 'premium',
            'unit': 'per sqft',
            'rate': fallback_data.get('quick-estimate-luxury', 6000),
            'description': 'Per sq ft rate for luxury construction (gray + partial finishing).',
        },
    ]

    for entry in quick_estimate_entries:
        Material.objects.get_or_create(
            id=entry['id'],
            defaults=entry,
        )
