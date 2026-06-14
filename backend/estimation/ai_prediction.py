"""
AI Cost Prediction Service using Google Gemini API
Provides intelligent construction cost forecasting for the Pakistan market.
"""
import json
import logging
import re
from decimal import Decimal
from django.conf import settings

logger = logging.getLogger(__name__)

# Try to import the Gemini SDK
try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-genai package not installed. AI predictions will use fallback engine.")


def _get_material_rates_context():
    """Fetch current material rates from DB to feed into AI context."""
    from .models import Material
    materials = Material.objects.filter(is_active=True).values('name', 'category', 'rate', 'unit', 'quality')
    rates = []
    for m in materials:
        rates.append(f"- {m['name']} ({m['quality']}): PKR {m['rate']}/{m['unit']}")
    return "\n".join(rates) if rates else "No material rates available in database."


def _build_prediction_prompt(params: dict, material_context: str) -> str:
    """Build the AI prompt for construction cost prediction."""
    plot_area = params.get('plot_area', 0)
    num_floors = params.get('num_floors', 1)
    construction_type = params.get('construction_type', 'gray')
    quality = params.get('quality', 'standard')
    location = params.get('location', 'Lahore')
    marla_size = params.get('marla_size', 225)
    prediction_months = params.get('prediction_months', 12)

    plot_sqft = float(plot_area) * float(marla_size)

    prompt = f"""You are ICEMGS AI — an expert construction cost prediction engine for residential construction in Pakistan.

## Current Market Data (from our database)
{material_context}

## Project Parameters
- Plot Area: {plot_area} marlas ({plot_sqft} sq ft) using {marla_size} sqft/marla
- Number of Floors: {num_floors}
- Construction Type: {"Gray Structure Only" if construction_type == "gray" else "Full Construction (Gray + Finishing)"}
- Quality Tier: {quality}
- Location: {location}, Pakistan
- Prediction Timeline: {prediction_months} months

## Instructions
Analyze the construction costs for this project and provide a comprehensive prediction. Consider:
1. Current material costs in Pakistan (cement, steel, bricks, sand, crush, labor)
2. Inflation trends in Pakistan's construction sector (historically 12-18% annually)
3. Seasonal variations (monsoon season impacts, Eid/festival labor shortages)
4. Supply chain factors specific to {location}
5. Government policy impacts (taxes, import duties on steel/cement)

## Required JSON Output
Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{{
  "current_estimate": {{
    "total_cost": <number in PKR>,
    "gray_structure_cost": <number>,
    "finishing_cost": <number or 0 if gray only>,
    "labor_cost": <number>,
    "per_sqft_rate": <number>
  }},
  "monthly_predictions": [
    {{
      "month": 1,
      "label": "Month name Year",
      "predicted_cost": <number>,
      "inflation_rate": <percentage as number>,
      "confidence": <percentage 0-100>,
      "key_factor": "brief explanation of dominant cost driver this month"
    }}
  ],
  "risk_factors": [
    {{
      "factor": "Risk name",
      "impact": "high|medium|low",
      "description": "Brief description",
      "potential_increase_pct": <number>
    }}
  ],
  "cost_breakdown": [
    {{
      "category": "Material category name",
      "current_cost": <number>,
      "predicted_cost_6m": <number>,
      "trend": "rising|stable|falling"
    }}
  ],
  "recommendations": [
    {{
      "title": "Recommendation title",
      "description": "Detailed recommendation",
      "potential_savings": <number in PKR>,
      "priority": "high|medium|low"
    }}
  ],
  "market_insights": {{
    "overall_trend": "rising|stable|falling",
    "inflation_forecast": "<percentage range>",
    "best_time_to_build": "recommendation on timing",
    "summary": "2-3 sentence market summary"
  }},
  "savings_if_start_now": <number in PKR saved vs waiting {prediction_months} months>
}}

Generate {prediction_months} entries in monthly_predictions. Use realistic Pakistan market rates for 2025-2026.
Provide 3-5 risk factors, 5-8 cost breakdown categories, and 3-5 actionable recommendations.
IMPORTANT: Return ONLY the JSON object, no other text."""

    return prompt


def _fallback_prediction(params: dict) -> dict:
    """Generate a rule-based fallback prediction when Gemini is unavailable."""
    from .models import Material
    import math
    from datetime import datetime, timedelta

    plot_area = float(params.get('plot_area', 5))
    num_floors = int(params.get('num_floors', 1))
    construction_type = params.get('construction_type', 'gray')
    quality = params.get('quality', 'standard')
    location = params.get('location', 'Lahore')
    marla_size = float(params.get('marla_size', 225))
    prediction_months = int(params.get('prediction_months', 12))

    plot_sqft = plot_area * marla_size
    total_built_area = plot_sqft * num_floors

    # Quality-based rates per sqft
    quality_rates = {
        'economy': 2800,
        'standard': 3500,
        'premium': 4500,
        'luxury': 6000,
    }
    base_rate = quality_rates.get(quality, 3500)

    gray_cost = total_built_area * base_rate
    finishing_cost = gray_cost * 0.5 if construction_type == 'full' else 0
    labor_cost = (gray_cost + finishing_cost) * 0.25
    current_total = gray_cost + finishing_cost + labor_cost

    # Monthly inflation rate (Pakistan construction: ~1.2-1.5% monthly)
    monthly_inflation = 0.013
    monthly_predictions = []
    now = datetime.now()

    for i in range(1, prediction_months + 1):
        future_date = now + timedelta(days=30 * i)
        predicted = current_total * math.pow(1 + monthly_inflation, i)
        
        # Add seasonal variation
        month_num = future_date.month
        seasonal_factor = 1.0
        if month_num in [7, 8]:  # Monsoon
            seasonal_factor = 1.02
        elif month_num in [12, 1]:  # Winter slowdown
            seasonal_factor = 0.99

        predicted *= seasonal_factor
        
        monthly_predictions.append({
            "month": i,
            "label": future_date.strftime("%B %Y"),
            "predicted_cost": round(predicted),
            "inflation_rate": round((monthly_inflation * 12 + (seasonal_factor - 1)) * 100, 1),
            "confidence": max(55, 95 - i * 3),
            "key_factor": _get_seasonal_factor(month_num)
        })

    final_cost = monthly_predictions[-1]["predicted_cost"] if monthly_predictions else current_total

    return {
        "current_estimate": {
            "total_cost": round(current_total),
            "gray_structure_cost": round(gray_cost),
            "finishing_cost": round(finishing_cost),
            "labor_cost": round(labor_cost),
            "per_sqft_rate": base_rate,
        },
        "monthly_predictions": monthly_predictions,
        "risk_factors": [
            {
                "factor": "Steel Price Volatility",
                "impact": "high",
                "description": "International steel prices directly impact Pakistan's construction costs due to import dependency.",
                "potential_increase_pct": 8
            },
            {
                "factor": "Cement Supply Constraints",
                "impact": "medium",
                "description": "Domestic cement production capacity vs demand balance affects pricing.",
                "potential_increase_pct": 5
            },
            {
                "factor": "PKR Exchange Rate",
                "impact": "high",
                "description": "Rupee depreciation increases costs of imported construction materials.",
                "potential_increase_pct": 10
            },
            {
                "factor": "Labor Shortage (Seasonal)",
                "impact": "medium",
                "description": "Festival seasons and monsoon cause labor shortages, increasing daily wages.",
                "potential_increase_pct": 4
            },
            {
                "factor": "Government Policy Changes",
                "impact": "low",
                "description": "Tax reforms or import duty changes can affect material costs.",
                "potential_increase_pct": 3
            }
        ],
        "cost_breakdown": [
            {"category": "Steel & Reinforcement", "current_cost": round(gray_cost * 0.25), "predicted_cost_6m": round(gray_cost * 0.25 * 1.08), "trend": "rising"},
            {"category": "Cement & Concrete", "current_cost": round(gray_cost * 0.20), "predicted_cost_6m": round(gray_cost * 0.20 * 1.05), "trend": "rising"},
            {"category": "Bricks & Masonry", "current_cost": round(gray_cost * 0.18), "predicted_cost_6m": round(gray_cost * 0.18 * 1.04), "trend": "stable"},
            {"category": "Sand & Aggregates", "current_cost": round(gray_cost * 0.12), "predicted_cost_6m": round(gray_cost * 0.12 * 1.06), "trend": "rising"},
            {"category": "Plaster & Finishing", "current_cost": round(gray_cost * 0.10), "predicted_cost_6m": round(gray_cost * 0.10 * 1.03), "trend": "stable"},
            {"category": "Roofing & Slab", "current_cost": round(gray_cost * 0.08), "predicted_cost_6m": round(gray_cost * 0.08 * 1.05), "trend": "rising"},
            {"category": "Miscellaneous", "current_cost": round(gray_cost * 0.07), "predicted_cost_6m": round(gray_cost * 0.07 * 1.04), "trend": "stable"},
        ],
        "recommendations": [
            {
                "title": "Lock Steel Prices Now",
                "description": "Purchase steel in bulk at current rates. International steel markets suggest a 5-8% increase in the next quarter.",
                "potential_savings": round(gray_cost * 0.02),
                "priority": "high"
            },
            {
                "title": "Start Foundation Before Monsoon",
                "description": "Complete foundation work before the monsoon season (July-August) to avoid weather delays and increased labor costs.",
                "potential_savings": round(current_total * 0.03),
                "priority": "high"
            },
            {
                "title": "Buy Cement in Off-Peak Season",
                "description": "Cement prices dip during winter months. Pre-purchase and store to save on costs.",
                "potential_savings": round(gray_cost * 0.015),
                "priority": "medium"
            },
            {
                "title": "Consider Phased Construction",
                "description": "Build in phases to spread costs over time and take advantage of seasonal price dips.",
                "potential_savings": round(current_total * 0.05),
                "priority": "medium"
            },
        ],
        "market_insights": {
            "overall_trend": "rising",
            "inflation_forecast": "12-16% annually",
            "best_time_to_build": "Start immediately or wait for winter (Nov-Feb) for slightly lower labor costs.",
            "summary": f"Construction costs in {location} are on an upward trend driven by steel imports and currency depreciation. Starting construction sooner will save an estimated PKR {round(final_cost - current_total):,} over {prediction_months} months."
        },
        "savings_if_start_now": round(final_cost - current_total),
        "ai_powered": False,
        "engine": "ICEMGS Rule-Based Engine"
    }


def _get_seasonal_factor(month: int) -> str:
    """Return seasonal cost factor description for a given month."""
    factors = {
        1: "Winter season — lower labor availability but stable material prices",
        2: "Post-winter recovery — construction activity picks up",
        3: "Spring season — optimal construction weather, stable costs",
        4: "Pre-summer — rising demand pushes material prices up",
        5: "Peak construction season — high demand for labor and materials",
        6: "Pre-monsoon — rush to complete outdoor work drives costs up",
        7: "Monsoon season — rain delays increase labor costs significantly",
        8: "Peak monsoon — limited outdoor construction, higher material costs",
        9: "Post-monsoon recovery — construction resumes, gradual price stabilization",
        10: "Autumn — good construction weather, moderate pricing",
        11: "Pre-winter — last push before cold weather, stable costs",
        12: "Year-end — festival season reduces labor availability"
    }
    return factors.get(month, "Normal market conditions")


def generate_ai_prediction(params: dict) -> dict:
    """
    Generate AI-powered cost prediction.
    Uses Gemini API if available, falls back to rule-based engine.
    """
    gemini_api_key = getattr(settings, 'GEMINI_API_KEY', None)

    if GEMINI_AVAILABLE and gemini_api_key:
        try:
            material_context = _get_material_rates_context()
            prompt = _build_prediction_prompt(params, material_context)

            client = genai.Client(api_key=gemini_api_key)
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=4096,
                ),
            )

            # Parse the JSON response
            response_text = response.text.strip()
            
            # Clean up any markdown code fences
            if response_text.startswith("```"):
                # Remove opening fence (```json or ```)
                response_text = re.sub(r'^```(?:json)?\s*\n?', '', response_text)
                # Remove closing fence
                response_text = re.sub(r'\n?```\s*$', '', response_text)

            prediction = json.loads(response_text)
            prediction['ai_powered'] = True
            prediction['engine'] = 'Google Gemini AI'
            return prediction

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini AI response as JSON: {e}")
            logger.error(f"Raw response: {response_text[:500]}")
            # Fall through to fallback
        except Exception as e:
            logger.error(f"Gemini AI prediction failed: {e}")
            # Fall through to fallback

    # Fallback to rule-based engine
    return _fallback_prediction(params)
