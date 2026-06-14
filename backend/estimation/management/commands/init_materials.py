"""
Management command to initialize default material prices in the database
"""
from django.core.management.base import BaseCommand
from estimation.models import Material


class Command(BaseCommand):
    help = 'Initialize database with default material prices'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Initializing default materials...'))

        materials = [
            # Floor Tiles
            {
                'id': 'floor-tiles-standard',
                'name': 'Standard Floor Tiles',
                'category': 'floor_tiles',
                'quality': 'standard',
                'unit': 'sqft',
                'rate': 280,
                'description': 'Basic ceramic floor tiles, 2x2 ft'
            },
            {
                'id': 'floor-tiles-good',
                'name': 'Porcelain Floor Tiles',
                'category': 'floor_tiles',
                'quality': 'good',
                'unit': 'sqft',
                'rate': 350,
                'description': 'Premium ceramic/porcelain floor tiles with better finish'
            },
            {
                'id': 'floor-tiles-premium',
                'name': 'Marble/Granite Floor',
                'category': 'floor_tiles',
                'quality': 'premium',
                'unit': 'sqft',
                'rate': 600,
                'description': 'High-end porcelain or imported tiles / Marble/Granite'
            },

            # Paint
            {
                'id': 'paint-standard',
                'name': 'Economy Paint',
                'category': 'paint',
                'quality': 'standard',
                'unit': 'sqft',
                'rate': 50,
                'description': 'Basic distemper/emulsion paint'
            },
            {
                'id': 'paint-good',
                'name': 'Premium Paint',
                'category': 'paint',
                'quality': 'good',
                'unit': 'sqft',
                'rate': 100,
                'description': 'Standard emulsion paint with good coverage'
            },
            {
                'id': 'paint-premium',
                'name': 'Luxury Paint',
                'category': 'paint',
                'quality': 'premium',
                'unit': 'sqft',
                'rate': 180,
                'description': 'Premium washable anti-fungal paint'
            },

            # Wall Tiles
            {
                'id': 'wall-tiles-standard',
                'name': 'Economy Wall Tiles',
                'category': 'wall_tiles',
                'quality': 'standard',
                'unit': 'sqft',
                'rate': 220,
                'description': 'Basic ceramic wall tiles for kitchens/bathrooms'
            },
            {
                'id': 'wall-tiles-good',
                'name': 'Premium Wall Tiles',
                'category': 'wall_tiles',
                'quality': 'good',
                'unit': 'sqft',
                'rate': 350,
                'description': 'Designer ceramic wall tiles'
            },
            {
                'id': 'wall-tiles-premium',
                'name': 'Luxury Wall Tiles',
                'category': 'wall_tiles',
                'quality': 'premium',
                'unit': 'sqft',
                'rate': 500,
                'description': 'Imported designer wall tiles'
            },

            # Doors
            {
                'id': 'doors-standard',
                'name': 'Flush/Fiber Doors',
                'category': 'doors',
                'quality': 'standard',
                'unit': 'piece',
                'rate': 22000,
                'description': 'Semi-solid MDF door with frame / Flush/Fiber Doors'
            },
            {
                'id': 'doors-good',
                'name': 'Engineered Doors',
                'category': 'doors',
                'quality': 'good',
                'unit': 'piece',
                'rate': 28000,
                'description': 'Solid wood door with better finish / Engineered Doors'
            },
            {
                'id': 'doors-premium',
                'name': 'Solid Wood Doors',
                'category': 'doors',
                'quality': 'premium',
                'unit': 'piece',
                'rate': 45000,
                'description': 'Designer solid wood or veneer door'
            },

            # Windows
            {
                'id': 'windows-standard',
                'name': 'Aluminum Windows',
                'category': 'windows',
                'quality': 'standard',
                'unit': 'sqft',
                'rate': 1200,
                'description': 'Basic aluminum window with glass'
            },
            {
                'id': 'windows-good',
                'name': 'UPVC Windows',
                'category': 'windows',
                'quality': 'good',
                'unit': 'sqft',
                'rate': 1800,
                'description': 'Powder-coated aluminum / UPVC window'
            },
            {
                'id': 'windows-premium',
                'name': 'Wooden Windows',
                'category': 'windows',
                'quality': 'premium',
                'unit': 'sqft',
                'rate': 2500,
                'description': 'UPVC or designer aluminum/wooden window'
            },

            # Electrical
            {
                'id': 'electrical-standard',
                'name': 'Standard Electrical',
                'category': 'electrical',
                'quality': 'standard',
                'unit': 'package',
                'rate': 22000,
                'description': 'Basic electrical wiring and fittings'
            },
            {
                'id': 'electrical-good',
                'name': 'Good Quality Electrical',
                'category': 'electrical',
                'quality': 'good',
                'unit': 'package',
                'rate': 35000,
                'description': 'Better quality wiring and branded fittings'
            },
            {
                'id': 'electrical-premium',
                'name': 'Premium Electrical',
                'category': 'electrical',
                'quality': 'premium',
                'unit': 'package',
                'rate': 55000,
                'description': 'High-end imported switches and advanced wiring'
            },

            # Plumbing
            {
                'id': 'plumbing-standard',
                'name': 'Standard Plumbing',
                'category': 'plumbing',
                'quality': 'standard',
                'unit': 'package',
                'rate': 45000,
                'description': 'Basic plumbing pipes and fittings'
            },
            {
                'id': 'plumbing-good',
                'name': 'Premium Plumbing',
                'category': 'plumbing',
                'quality': 'good',
                'unit': 'package',
                'rate': 65000,
                'description': 'Better quality pipes and branded fittings'
            },

            # Sanitary
            {
                'id': 'sanitary-standard',
                'name': 'Standard Sanitary',
                'category': 'sanitary',
                'quality': 'standard',
                'unit': 'package',
                'rate': 65000,
                'description': 'Basic bathroom fittings (commode, basin, taps)'
            },
            {
                'id': 'sanitary-good',
                'name': 'Premium Sanitary',
                'category': 'sanitary',
                'quality': 'good',
                'unit': 'package',
                'rate': 110000,
                'description': 'Branded bathroom fittings with better quality'
            },
            {
                'id': 'sanitary-premium',
                'name': 'Luxury Sanitary',
                'category': 'sanitary',
                'quality': 'premium',
                'unit': 'package',
                'rate': 250000,
                'description': 'Imported high-end bathroom fittings'
            },

            # Cabinets
            {
                'id': 'cabinets-standard',
                'name': 'Basic Kitchen Cabinets',
                'category': 'cabinets',
                'quality': 'standard',
                'unit': 'sqft',
                'rate': 1800,
                'description': 'Basic kitchen cabinets with laminate finish'
            },
            {
                'id': 'cabinets-good',
                'name': 'Modular Kitchen Cabinets',
                'category': 'cabinets',
                'quality': 'good',
                'unit': 'sqft',
                'rate': 2800,
                'description': 'Better quality cabinets with good hardware'
            },
            {
                'id': 'cabinets-premium',
                'name': 'Premium Kitchen Cabinets',
                'category': 'cabinets',
                'quality': 'premium',
                'unit': 'sqft',
                'rate': 4500,
                'description': 'High-end modular kitchen cabinets'
            },

            # Gray Structure Materials — Foundation
            {
                'id': 'foundation-concrete',
                'name': 'Foundation Concrete',
                'category': 'other',
                'quality': 'standard',
                'unit': 'cft',
                'rate': 400,
                'description': 'RCC foundation concrete (mixed & poured)'
            },

            # Gray Structure Materials — Bricks
            {
                'id': 'brick-solid',
                'name': 'Awwal Bricks',
                'category': 'bricks',
                'quality': 'standard',
                'unit': 'piece',
                'rate': 17,
                'description': 'Awwal quality fired clay bricks'
            },
            {
                'id': 'brick-fly-ash',
                'name': 'Fly Ash Bricks',
                'category': 'bricks',
                'quality': 'good',
                'unit': 'piece',
                'rate': 22,
                'description': 'Eco-friendly fly ash bricks'
            },

            # Gray Structure Materials — Cement
            {
                'id': 'cement-opc-43',
                'name': 'Cement OPC 43',
                'category': 'cement',
                'quality': 'standard',
                'unit': 'bag',
                'rate': 1450,
                'description': 'Ordinary Portland Cement 43 Grade (50kg bag)'
            },
            {
                'id': 'cement-opc-53',
                'name': 'Cement OPC 53',
                'category': 'cement',
                'quality': 'good',
                'unit': 'bag',
                'rate': 1500,
                'description': 'Ordinary Portland Cement 53 Grade (50kg bag)'
            },

            # Gray Structure Materials — Steel
            {
                'id': 'steel-grade-40',
                'name': 'Steel Grade 40',
                'category': 'steel',
                'quality': 'standard',
                'unit': 'kg',
                'rate': 250,
                'description': 'Reinforcement steel bars Grade 40'
            },
            {
                'id': 'steel-grade-60',
                'name': 'Steel Grade 60',
                'category': 'steel',
                'quality': 'good',
                'unit': 'kg',
                'rate': 260,
                'description': 'Reinforcement steel bars Grade 60'
            },

            # Gray Structure Materials — Aggregates
            {
                'id': 'sand',
                'name': 'Sand (Bajri)',
                'category': 'sand',
                'quality': 'standard',
                'unit': 'cft',
                'rate': 90,
                'description': 'River sand for construction'
            },
            {
                'id': 'crush',
                'name': 'Crush (Stone Chips)',
                'category': 'gravel',
                'quality': 'standard',
                'unit': 'cft',
                'rate': 130,
                'description': 'Crushed stone chips for concrete'
            },

            # Gray Structure Materials — Plaster
            {
                'id': 'plaster-cement',
                'name': 'Cement Plaster',
                'category': 'other',
                'quality': 'standard',
                'unit': 'sqft',
                'rate': 65,
                'description': 'Cement sand plaster (inner & outer walls)'
            },
            {
                'id': 'plaster-gypsum',
                'name': 'Gypsum Plaster',
                'category': 'other',
                'quality': 'good',
                'unit': 'sqft',
                'rate': 85,
                'description': 'Gypsum plaster for smooth interior walls'
            },

            # Gray Structure Materials — Roof
            {
                'id': 'roof-slab-pouring',
                'name': 'Roof Slab Pouring',
                'category': 'other',
                'quality': 'standard',
                'unit': 'sqft',
                'rate': 45,
                'description': 'RCC slab pouring with labor & machinery'
            },

            # Additional materials
            {
                'id': 'waterproofing',
                'name': 'Waterproofing Material',
                'category': 'other',
                'quality': 'standard',
                'unit': 'sqft',
                'rate': 45,
                'description': 'Waterproofing coating/material'
            },
            {
                'id': 'shuttering',
                'name': 'Shuttering Material (Rental)',
                'category': 'other',
                'quality': 'standard',
                'unit': 'sqft',
                'rate': 25,
                'description': 'Shuttering plates rental'
            },
            {
                'id': 'parapet-walls',
                'name': 'Parapet Walls (Standard 3.5 ft high roof boundary)',
                'category': 'other',
                'quality': 'standard',
                'unit': 'sq ft',
                'rate': 350,
                'description': 'Boundary/parapet wall standard construction'
            },
            {
                'id': 'spiral-stairs',
                'name': 'External Spiral Stairs (Iron/Steel Fabrication)',
                'category': 'other',
                'quality': 'standard',
                'unit': 'job',
                'rate': 85000,
                'description': 'Spiral stairs iron/steel fabrication'
            },
            {
                'id': 'water-tank',
                'name': 'Water Tank & Installation',
                'category': 'other',
                'quality': 'standard',
                'unit': 'set',
                'rate': 45000,
                'description': 'Water storage tank'
            },
            {
                'id': 'false-ceiling',
                'name': 'False Ceiling (Selected Areas)',
                'category': 'other',
                'quality': 'standard',
                'unit': 'sq ft',
                'rate': 180,
                'description': 'False ceiling installation'
            },
        ]

        created_count = 0
        updated_count = 0

        for material_data in materials:
            material, created = Material.objects.update_or_create(
                id=material_data['id'],
                defaults=material_data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'[+] Created: {material.name}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'[~] Updated: {material.name}'))

        self.stdout.write(
            self.style.SUCCESS(
                f'\nInitialization complete! Created: {created_count}, Updated: {updated_count}'
            )
        )
