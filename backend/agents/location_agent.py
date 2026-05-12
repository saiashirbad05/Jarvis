"""
LocationAgent — Uses Google Maps API for real provider discovery and review intelligence.
Returns real nearby providers with ratings, reviews, Maps URLs, and distance info.
Refactored to be fully compliant with the Google ADK (Agent Development Kit) framework.
"""
import os
import math
import googlemaps
from typing import Dict, Any, List
from google import adk
from google.adk.tools import FunctionTool
from google import genai
from google.genai import types

# Import db only if available (graceful fallback for testing)
try:
    from db.database import upsert_provider, get_providers_by_city
    HAS_DB = True
except ImportError:
    HAS_DB = False

CITY_COORDINATES = {
    "delhi": {"lat": 28.6139, "lng": 77.2090},
    "new delhi": {"lat": 28.6139, "lng": 77.2090},
    "mumbai": {"lat": 19.0760, "lng": 72.8777},
    "bengaluru": {"lat": 12.9716, "lng": 77.5946},
    "bangalore": {"lat": 12.9716, "lng": 77.5946},
    "chennai": {"lat": 13.0827, "lng": 80.2707},
    "kolkata": {"lat": 22.5726, "lng": 88.3639},
    "hyderabad": {"lat": 17.3850, "lng": 78.4867},
    "pune": {"lat": 18.5204, "lng": 73.8567},
    "noida": {"lat": 28.5355, "lng": 77.3910},
    "gurugram": {"lat": 28.4595, "lng": 77.0266},
    "gurgaon": {"lat": 28.4595, "lng": 77.0266},
    "lucknow": {"lat": 26.8467, "lng": 80.9462},
    "jaipur": {"lat": 26.9124, "lng": 75.7873},
    "ahmedabad": {"lat": 23.0225, "lng": 72.5714},
    "surat": {"lat": 21.1702, "lng": 72.8311},
    "coimbatore": {"lat": 11.0168, "lng": 76.9558},
    "kochi": {"lat": 9.9312, "lng": 76.2673},
}

class LocationAgent:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        self.gmaps = googlemaps.Client(key=self.api_key) if self.api_key else None
        self.model_name = os.getenv("AGENT_MODEL_FLASH", "gemini-2.5-flash")

        # 1. Initialize standard Google GenAI client for rapid, direct localized intelligence summary
        try:
            self.genai_client = genai.Client()
            self.has_genai = True
            print("[LocationAgent] Google GenAI Client successfully initialized.")
        except Exception as e:
            print(f"[LocationAgent] GenAI Client Init failed (falling back to static heuristics): {e}")
            self.has_genai = False

        # 2. Register Google Maps tools as official ADK FunctionTools
        self.geocode_tool = FunctionTool(self._geocode_address)
        self.places_search_tool = FunctionTool(self._search_places_nearby)
        self.place_details_tool = FunctionTool(self._get_place_details_tool)

        # 3. Instantiate the Google ADK Agent for boardroom / coordinator integration
        self.adk_agent = adk.Agent(
            name="LocationAgent",
            description="Acquires precise geolocation data and local technician profiles via Google Maps.",
            instruction=(
                "You are the Location & Competitor Density Expert for ServiceOne. "
                "Use the provided Google Maps tools to geocode the user's zip/city and "
                "find local repair competitors. Analyze their rating density and local tiers."
            ),
            tools=[self.geocode_tool, self.places_search_tool, self.place_details_tool],
            model=self.model_name
        )

    def _geocode_address(self, query: str) -> Dict[str, Any]:
        """Geocode a city or ZIP code to obtain lat/lng coordinates and formatted address."""
        if not self.gmaps:
            return {"status": "missing_api_key"}
        try:
            res = self.gmaps.geocode(query)
            if res:
                loc = res[0]['geometry']['location']
                return {
                    "lat": loc['lat'],
                    "lng": loc['lng'],
                    "formatted_address": res[0].get('formatted_address', query),
                    "status": "success"
                }
            return {"status": "no_results"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _search_places_nearby(self, lat: float, lng: float, keyword: str) -> List[Dict[str, Any]]:
        """Search for service providers nearby the given coordinates using a specific keyword."""
        if not self.gmaps:
            return []
        try:
            res = self.gmaps.places_nearby(
                location=(lat, lng),
                radius=150000,  # 150km radius
                keyword=keyword
            )
            return res.get('results', [])
        except Exception as e:
            print(f"[LocationAgent Tool] Search error for '{keyword}': {e}")
            return []

    def _get_place_details_tool(self, place_id: str) -> Dict[str, Any]:
        """Fetch complete contact information, website, and top reviews for a specific Google Place ID."""
        if not self.gmaps:
            return {}
        try:
            details = self.gmaps.place(
                place_id,
                fields=['name', 'formatted_phone_number', 'website', 'reviews', 
                        'url', 'formatted_address', 'opening_hours']
            )
            return details.get('result', {})
        except Exception as e:
            print(f"[LocationAgent Tool] Details error: {e}")
            return {}

    async def analyze(self, quote_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Uses Google Maps API and ADK-compliant tools to gather real geographic + provider intelligence.
        Returns nearby providers with ratings, reviews, and Maps links.
        """
        city = quote_data.get("user_zip_code", "India")
        appliance = quote_data.get("appliance_type", "appliance")
        service = quote_data.get("service_type", "repair")
        brand = quote_data.get("brand", "")

        if not self.gmaps:
            # High-fidelity offline geocoding backup
            lat, lng = 28.6139, 77.2090  # Default Delhi
            city_lower = city.lower()
            city_name_extracted = city.split("-")[-1].split(",")[0].strip().lower()
            for name, coords in CITY_COORDINATES.items():
                if name in city_lower or name in city_name_extracted:
                    lat, lng = coords["lat"], coords["lng"]
                    break
            return {
                "lat": lat,
                "lng": lng,
                "formatted_address": city,
                "location_type": "Static Fallback",
                "cost_of_living_index": 1.0,
                "competitor_density": "Medium",
                "nearby_providers": [],
                "status": "simulated (missing API key)"
            }

        try:
            # 1. Geocode the city/area via the official geocode tool
            geo_res = self._geocode_address(city)
            if geo_res.get("status") != "success":
                return {"status": "failed_to_geocode", "nearby_providers": []}

            lat = geo_res["lat"]
            lng = geo_res["lng"]
            formatted_address = geo_res["formatted_address"]

            # 2. Search for nearby repair/service providers via places search tool
            search_keywords = [
                f"{appliance} {service}",
                f"{appliance} repair service",
                f"{brand} {appliance} service center" if brand else f"{appliance} service center",
            ]

            all_providers = []
            seen_place_ids = set()

            for keyword in search_keywords:
                places = self._search_places_nearby(lat, lng, keyword)
                for place in places:
                    place_id = place.get('place_id')
                    if not place_id or place_id in seen_place_ids:
                        continue
                    seen_place_ids.add(place_id)

                    provider = self._parse_place(place, lat, lng)
                    if provider:
                        all_providers.append(provider)

            # 3. Sort by rating and review count
            all_providers.sort(
                key=lambda p: (p.get('avg_rating', 0) * 0.6 + min(p.get('review_count', 0), 100) / 100 * 0.4),
                reverse=True
            )

            # Take top 10 providers
            top_providers = all_providers[:10]

            # 4. Get detailed reviews for top 3 providers via the details tool
            for i, provider in enumerate(top_providers[:3]):
                p_id = provider.get('place_id')
                if p_id:
                    place_details = self._get_place_details_tool(p_id)
                    if place_details:
                        parsed_details = self._parse_place_details(place_details)
                        top_providers[i].update(parsed_details)

            # 5. Cache providers in Cloud SQL
            if HAS_DB:
                for provider in top_providers:
                    try:
                        upsert_provider({
                            "name": provider.get("name", "Unknown"),
                            "city": city,
                            "area": provider.get("area", ""),
                            "appliance_types": [appliance],
                            "phone": provider.get("phone"),
                            "address": provider.get("address", ""),
                            "google_maps_url": provider.get("maps_url", ""),
                            "website_url": provider.get("website"),
                            "source": "google_maps",
                            "source_url": provider.get("maps_url", ""),
                            "avg_rating": provider.get("avg_rating"),
                            "review_count": provider.get("review_count", 0),
                            "avg_price_min": None,
                            "avg_price_max": None,
                        })
                    except Exception as e:
                        print(f"[LocationAgent] DB save error: {e}")

            # 6. Calculate market signals
            competitor_count = len(all_providers)
            density = "High" if competitor_count > 12 else "Medium" if competitor_count > 4 else "Low"

            # Sophisticated Indian City Tier Classification
            tier_1_metros = ["mumbai", "delhi", "bangalore", "bengaluru", "chennai", "hyderabad", "kolkata", "pune", "gurgaon", "noida", "ghaziabad"]
            tier_2_cities = ["ahmedabad", "jaipur", "surat", "lucknow", "kanpur", "nagpur", "patna", "indore", "thane", "bhopal", "visakhapatnam", "vadodara", "coimbatore", "kochi", "kozhikode", "madurai", "guwahati", "chandigarh", "bhubaneswar"]
            
            city_lower = city.lower()
            
            if any(metro in city_lower for metro in tier_1_metros):
                city_tier = "Tier-1 (Major Metro)"
                col_index = 1.25
                logistic_complexity = 1.15
            elif any(t2 in city_lower for t2 in tier_2_cities):
                city_tier = "Tier-2 (Rapid Growth Urban)"
                col_index = 1.10
                logistic_complexity = 1.00
            else:
                city_tier = "Tier-3 (Semi-Urban / Rural)"
                col_index = 0.95
                logistic_complexity = 0.85

            # Competitive density multiplier to adjust price targets
            density_adjustment = 0.92 if competitor_count > 12 else 1.00 if competitor_count > 4 else 1.08

            # Generate gorgeous, hyper-intelligent density insights if GenAI client is available
            density_insight = ""
            if hasattr(self, "has_genai") and self.has_genai:
                try:
                    prompt = (
                        f"You are the Lead Geodemographic Analyst for ServiceOne. Write a 1-2 sentence, polished, "
                        f"insightful summary of the local repair ecosystem.\n\n"
                        f"Context:\n"
                        f"- City/Area: {city} ({city_tier})\n"
                        f"- Appliance & Service: {brand} {appliance} {service}\n"
                        f"- Regional Competitor Count: {competitor_count} ({density} Density)\n"
                        f"- Cost of Living (COL) Factor: {col_index}x\n"
                        f"- Logistics Complexity: {logistic_complexity}x\n\n"
                        f"Rules:\n"
                        f"1. Explain how the combination of competitor density and city tier affects local service speed and fair price options.\n"
                        f"2. Be concise, premium, and highly professional. Return plain text without formatting."
                    )
                    response = self.genai_client.models.generate_content(
                        model=self.model_name,
                        contents=prompt
                    )
                    density_insight = response.text.strip()
                except Exception as genai_err:
                    print(f"[LocationAgent] GenAI density insight error: {genai_err}")

            if not density_insight:
                density_insight = f"Found {competitor_count} local service center(s) in {city}. Competitive density is {density} for this region."

            return {
                "lat": lat,
                "lng": lng,
                "formatted_address": formatted_address,
                "competitor_count": competitor_count,
                "competitor_density": density,
                "cost_of_living_index": col_index,
                "city_tier": city_tier,
                "logistic_complexity_score": logistic_complexity,
                "density_adjustment_factor": density_adjustment,
                "density_insight": density_insight,
                "nearby_providers": top_providers,
                "status": "success"
            }

        except Exception as e:
            print(f"[LocationAgent] Error: {e}")
            return {
                "status": f"error: {str(e)}",
                "nearby_providers": []
            }

    def _parse_place(self, place: dict, user_lat: float, user_lng: float) -> Dict | None:
        """Parse a Google Places result into a provider card."""
        name = place.get('name', '')
        if not name:
            return None

        rating = place.get('rating', 0)
        review_count = place.get('user_ratings_total', 0)
        
        # Skip very low quality results
        if rating < 2.0 and review_count > 0:
            return None

        place_location = place.get('geometry', {}).get('location', {})
        place_lat = place_location.get('lat', 0)
        place_lng = place_location.get('lng', 0)

        # Calculate approximate distance
        distance_km = self._haversine(user_lat, user_lng, place_lat, place_lng)

        # Build Google Maps URL
        maps_url = f"https://www.google.com/maps/place/?q=place_id:{place.get('place_id', '')}"

        return {
            "name": name,
            "place_id": place.get('place_id'),
            "address": place.get('vicinity', ''),
            "area": place.get('vicinity', '').split(',')[0] if place.get('vicinity') else '',
            "avg_rating": rating,
            "review_count": review_count,
            "distance_km": round(distance_km, 1),
            "maps_url": maps_url,
            "is_open": place.get('opening_hours', {}).get('open_now', None),
            "business_status": place.get('business_status', 'OPERATIONAL'),
            "source": "google_maps",
        }

    def _parse_place_details(self, result: dict) -> Dict:
        """Parse Google Place details results into rich sentiment reviews."""
        reviews = result.get('reviews', [])
        review_summaries = []
        positive_keywords = []
        negative_keywords = []

        for review in reviews[:5]:
            rating = review.get('rating', 0)
            text = review.get('text', '')
            author = review.get('author_name', 'Anonymous')
            
            review_summaries.append({
                "author": author,
                "rating": rating,
                "text": text[:200],
                "time": review.get('relative_time_description', ''),
            })

            # Extract sentiment keywords
            if rating >= 4:
                for word in ['professional', 'honest', 'quick', 'fair', 'good', 'excellent', 'reliable', 'affordable']:
                    if word in text.lower():
                        positive_keywords.append(word)
            elif rating <= 2:
                for word in ['overcharg', 'rude', 'late', 'expensive', 'bad', 'worst', 'scam', 'cheat']:
                    if word in text.lower():
                        negative_keywords.append(word)

        return {
            "phone": result.get('formatted_phone_number'),
            "website": result.get('website'),
            "maps_url": result.get('url', ''),
            "full_address": result.get('formatted_address', ''),
            "reviews": review_summaries,
            "positive_keywords": list(set(positive_keywords)),
            "negative_keywords": list(set(negative_keywords)),
            "opening_hours": result.get('opening_hours', {}).get('weekday_text', []),
        }

    @staticmethod
    def _haversine(lat1, lon1, lat2, lon2):
        """Calculate approximate distance in km between two points."""
        R = 6371  # Earth's radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
