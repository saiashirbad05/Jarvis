"""
TinyFish Client — Python wrapper around the TinyFish CLI.
Provides search, fetch, and browser agent capabilities for real-world data scraping.
"""
import subprocess
import json
import os
import re
from typing import List, Dict, Any, Optional


class TinyFishClient:
    """Wrapper around the TinyFish CLI for search, fetch, and browser automation."""

    def __init__(self):
        self.cli = "tinyfish"
        self._verify_auth()

    def _verify_auth(self):
        """Check if TinyFish is authenticated."""
        try:
            result = self._run_cmd(["auth", "status"])
            data = json.loads(result)
            if not data.get("authenticated"):
                print("[TinyFish] WARNING: Not authenticated. Run 'tinyfish auth login'")
        except Exception as e:
            print(f"[TinyFish] Auth check failed: {e}")

    def _run_cmd(self, args: List[str], timeout: int = 30) -> str:
        """Run a TinyFish CLI command and return stdout."""
        cmd = [self.cli] + args
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                shell=True,
                encoding='utf-8',
                errors='replace'
            )
            if result.returncode != 0 and result.stderr:
                print(f"[TinyFish] stderr: {result.stderr[:200]}")
            return result.stdout.strip()
        except subprocess.TimeoutExpired:
            print(f"[TinyFish] Command timed out: {' '.join(cmd)}")
            return ""
        except Exception as e:
            print(f"[TinyFish] Command failed: {e}")
            return ""

    # ── Search API ───────────────────────────────────────────
    def search(self, query: str, location: str = "India") -> Dict[str, Any]:
        """
        Search the web using TinyFish Search API.
        Returns parsed search results with URLs, titles, and snippets.
        """
        args = ["search", "query", query, "--location", location]
        raw = self._run_cmd(args, timeout=15)
        
        if not raw:
            return {"results": [], "total": 0, "status": "error"}

        try:
            data = json.loads(raw)
            results = []
            for item in data.get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("snippet", ""),
                })
            return {
                "results": results,
                "total": len(results),
                "query": query,
                "status": "success"
            }
        except json.JSONDecodeError:
            # Parse pretty output as fallback
            return self._parse_pretty_search(raw, query)

    def _parse_pretty_search(self, raw: str, query: str) -> Dict[str, Any]:
        """Parse the --pretty formatted output from tinyfish search."""
        results = []
        lines = raw.split("\n")
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            # Match numbered results like "1. Title here"
            match = re.match(r'^\d+\.\s+(.+)$', line)
            if match:
                title = match.group(1)
                url = ""
                snippet = ""
                # Next line is usually the URL
                if i + 1 < len(lines):
                    url_line = lines[i + 1].strip()
                    if url_line.startswith("http"):
                        url = url_line
                # Lines after URL until next number are the snippet
                snippet_lines = []
                j = i + 2
                while j < len(lines):
                    next_line = lines[j].strip()
                    if re.match(r'^\d+\.\s+', next_line) or next_line == "":
                        break
                    snippet_lines.append(next_line)
                    j += 1
                snippet = " ".join(snippet_lines)
                results.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                })
                i = j
            else:
                i += 1

        return {
            "results": results,
            "total": len(results),
            "query": query,
            "status": "success"
        }

    # ── Fetch API ────────────────────────────────────────────
    def fetch(self, urls: List[str], format: str = "json", include_links: bool = False) -> Dict[str, Any]:
        """
        Fetch and extract clean content from one or more URLs.
        Returns structured content for each URL.
        """
        args = ["fetch", "content", "get"] + urls + ["--format", format]
        if include_links:
            args.append("--links")
        
        raw = self._run_cmd(args, timeout=30)
        
        if not raw:
            return {"pages": [], "status": "error"}

        try:
            data = json.loads(raw)
            return {"pages": data if isinstance(data, list) else [data], "status": "success"}
        except json.JSONDecodeError:
            return {"pages": [{"raw_content": raw}], "status": "success"}

    def fetch_single(self, url: str, format: str = "markdown") -> str:
        """Fetch a single URL and return its content as text."""
        result = self.fetch([url], format=format)
        pages = result.get("pages", [])
        if pages:
            page = pages[0]
            return page.get("content", page.get("text", page.get("raw_content", "")))
        return ""

    # ── Browser Agent API ────────────────────────────────────
    def browser_agent(self, goal: str, url: str, sync: bool = True) -> Dict[str, Any]:
        """
        Run a browser automation task using TinyFish Agent.
        This uses a real headless browser to interact with dynamic pages.
        """
        args = ["agent", "run", goal, "--url", url]
        if sync:
            args.append("--sync")
        
        raw = self._run_cmd(args, timeout=60)
        
        if not raw:
            return {"result": None, "status": "error"}

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"result": raw, "status": "success"}

    # ── High-Level Helpers ───────────────────────────────────
    def search_service_prices(self, appliance: str, service: str, city: str, brand: str = "") -> Dict[str, Any]:
        """
        Search for real service prices using multiple strategies.
        Returns aggregated price data from multiple sources.
        """
        queries = [
            f"{brand} {appliance} {service} price in {city}".strip(),
            f"{appliance} {service} cost {city} Urban Company Sulekha",
            f"{appliance} repair charges {city} 2025",
        ]
        
        all_results = []
        source_links = []
        
        for query in queries:
            search_data = self.search(query, location=f"{city}, India")
            for r in search_data.get("results", []):
                all_results.append(r)
                if r.get("url"):
                    source_links.append({
                        "title": r.get("title", ""),
                        "url": r["url"],
                        "snippet": r.get("snippet", "")
                    })
        
        return {
            "results": all_results,
            "source_links": source_links[:15],  # Top 15 sources
            "status": "success"
        }

    def extract_prices_from_results(self, results: List[Dict]) -> List[float]:
        """Extract INR prices from search result snippets."""
        prices = []
        patterns = [
            r'₹\s?(\d+(?:,\d+)*)',
            r'Rs\.?\s?(\d+(?:,\d+)*)',
            r'(\d+(?:,\d+)*)\s?INR',
            r'Starting at ₹(\d+(?:,\d+)*)',
            r'from ₹(\d+(?:,\d+)*)',
        ]
        
        for result in results:
            text = f"{result.get('title', '')} {result.get('snippet', '')}"
            for pattern in patterns:
                matches = re.findall(pattern, text)
                for m in matches:
                    try:
                        val = float(m.replace(',', ''))
                        # Filter noise: only reasonable service prices
                        if 100 < val < 50000:
                            prices.append(val)
                    except ValueError:
                        continue
        
        return sorted(set(prices))

    def fetch_provider_details(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Fetch detailed content from provider URLs for deep price extraction."""
        provider_data = []
        # Fetch top 3 most relevant URLs
        target_urls = [u for u in urls if any(
            domain in u for domain in ["urbancompany.com", "sulekha.com", "justdial.com", "nobroker.in"]
        )][:3]
        
        if not target_urls:
            target_urls = urls[:2]
        
        for url in target_urls:
            content = self.fetch_single(url, format="markdown")
            if content:
                provider_data.append({
                    "url": url,
                    "content": content[:3000],  # Limit to 3KB
                })
        
        return provider_data


# Singleton instance
_client = None

def get_tinyfish_client() -> TinyFishClient:
    """Get or create the singleton TinyFish client."""
    global _client
    if _client is None:
        _client = TinyFishClient()
    return _client
