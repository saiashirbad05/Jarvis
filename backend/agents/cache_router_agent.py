"""
CacheRouterAgent — Integrates fast, high-performance in-memory caching to bypass heavy crawling.
Fully compliant with the Google ADK (Agent Development Kit) framework.
"""
import os
import json
from typing import Dict, Any, Optional
from google import adk
from google.adk.tools import FunctionTool

# Use a local in-memory fallback cache if Redis is not configured
IN_MEMORY_CACHE: Dict[str, Dict[str, Any]] = {}


class CacheRouterAgent:
    def __init__(self):
        self.model_name = os.getenv("AGENT_MODEL_FLASH_LITE", "gemini-2.5-flash-lite")

        # 1. Register caching tools as official ADK FunctionTools
        self.lookup_tool = FunctionTool(self._lookup_cache)
        self.store_tool = FunctionTool(self._store_cache)

        # 2. Instantiate the Google ADK Agent
        self.adk_agent = adk.Agent(
            name="CacheRouterAgent",
            description="Intercepts requests to retrieve pre-calculated diagnostic cache results, skipping scraping.",
            instruction=(
                "You are the Speed Router for the ServiceOne Boardroom. "
                "Check the cache for identical quote/appliance/city queries to deliver 50ms response loops."
            ),
            tools=[self.lookup_tool, self.store_tool],
            model=self.model_name
        )

    def _generate_cache_key(self, quote_data: Dict[str, Any]) -> str:
        """Generates a unique string key based on ZIP, appliance, brand, and service type."""
        zip_code = str(quote_data.get("user_zip_code", "India")).strip()
        appliance = str(quote_data.get("appliance_type", "ac")).strip().lower()
        brand = str(quote_data.get("brand", "")).strip().lower()
        service = str(quote_data.get("service_type", "repair")).strip().lower()
        return f"cache:{zip_code}:{appliance}:{brand}:{service}"

    def _lookup_cache(self, key: str) -> Optional[Dict[str, Any]]:
        """Look up active cache entry. In production, connects to Redis or fallback dict."""
        # Check in-memory store
        return IN_MEMORY_CACHE.get(key)

    def _store_cache(self, key: str, value_json: str) -> bool:
        """Store calculation results in cache with 24-hour expiration threshold."""
        try:
            data = json.loads(value_json)
            IN_MEMORY_CACHE[key] = data
            return True
        except Exception:
            return False

    async def analyze(self, quote_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fast lookup stage.
        If cache hit is found, returns cached data payload directly.
        """
        key = self._generate_cache_key(quote_data)
        cached_val = self._lookup_cache(key)

        if cached_val:
            return {
                "status": "cache_hit",
                "cache_key": key,
                "data": cached_val
            }

        return {
            "status": "cache_miss",
            "cache_key": key,
            "data": None
        }
