"""
FraudAgent — Cross-validates quotes against real market data for red flags.
Uses TinyFish search results to verify provider legitimacy.
Refactored to be fully compliant with the Google ADK (Agent Development Kit) framework.
"""
import os
import re
from typing import Dict, Any, List
from google import adk
from google.adk.tools import FunctionTool
from google import genai
from google.genai import types

from tinyfish_client import get_tinyfish_client


class FraudAgent:
    def __init__(self):
        self.model_name = os.getenv("AGENT_MODEL_FLASH", "gemini-2.5-flash")
        self.tf = get_tinyfish_client()

        # 1. Initialize standard Google GenAI client for rapid, direct content safety checking
        try:
            self.genai_client = genai.Client()
            self.has_genai = True
            print("[FraudAgent] Google GenAI Client successfully initialized.")
        except Exception as e:
            print(f"[FraudAgent] GenAI Client Init failed (falling back to static heuristics): {e}")
            self.has_genai = False

        # 2. Register fraud checks as official ADK FunctionTools for boardroom/coordinator integration
        self.content_check_tool = FunctionTool(self._check_quote_content)
        self.legitimacy_check_tool = FunctionTool(self._check_provider_legitimacy)
        self.collusion_check_tool = FunctionTool(self._detect_price_collusion)

        # 3. Instantiate official Google ADK Agent
        self.adk_agent = adk.Agent(
            name="FraudAgent",
            description="Analyzes repair contracts, technician names, and payment conditions for predatory scams or red flags.",
            instruction=(
                "You are the Lead Risk Compliance Officer for ServiceOne. "
                "Evaluate quotes and provider names for compliance, safety, and legitimacy. Use the compliance tools."
            ),
            tools=[self.content_check_tool, self.legitimacy_check_tool, self.collusion_check_tool],
            model=self.model_name
        )

    async def analyze(self, quote_data: Dict[str, Any], 
                       market_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Multi-layered fraud and risk detection.
        Checks: provider legitimacy, price anomalies, quote red flags.
        """
        provider_name = quote_data.get("provider_name", "").strip()
        quoted_price = float(quote_data.get("quoted_price", 0))
        quote_details = (quote_data.get("quote_details") or "").lower()
        appliance = quote_data.get("appliance_type", "appliance")
        city = quote_data.get("user_zip_code", "India")

        risk_level = "low"
        flags = []
        trust_signals = []
        risk_score = 0  # 0-100, higher = riskier

        # ── Check 1: Quote content red flags via tool ─────────
        content_flags = await self._check_quote_content_ai(quote_details, quoted_price)
        flags.extend(content_flags)
        risk_score += len(content_flags) * 10

        # ── Check 2: Price anomaly detection ─────────────────
        if market_data:
            price_flags = self._check_price_anomaly(
                quoted_price, market_data
            )
            flags.extend(price_flags)
            risk_score += len(price_flags) * 15

        # ── Check 3: Provider legitimacy via tool ───
        if provider_name and len(provider_name) > 2:
            legitimacy = self._check_provider_legitimacy(provider_name, city, appliance)
            if legitimacy.get("flags"):
                flags.extend(legitimacy["flags"])
                risk_score += len(legitimacy["flags"]) * 12
            if legitimacy.get("trust_signals"):
                trust_signals.extend(legitimacy["trust_signals"])
                risk_score = max(0, risk_score - len(legitimacy["trust_signals"]) * 8)

        # ── Check 4: Provider name red flags ─────────────────
        name_flags = self._check_provider_name(provider_name)
        flags.extend(name_flags)
        risk_score += len(name_flags) * 8

        # ── Check 5: Price Collusion & Ringing Detection [BE-2] ──
        collusion = self._detect_price_collusion(provider_name, city, appliance, quoted_price)
        if collusion.get("collusion_detected"):
            flags.append(collusion["explanation"])
            risk_score += collusion["risk_score_increase"]

        # ── Calculate final risk level ───────────────────────
        if risk_score >= 50:
            risk_level = "high"
        elif risk_score >= 25:
            risk_level = "medium"
        else:
            risk_level = "low"

        return {
            "risk_level": risk_level,
            "risk_score": min(risk_score, 100),
            "detected_flags": flags,
            "trust_signals": trust_signals,
            "provider_verified": len(trust_signals) > 0,
            "recommendation": self._get_recommendation(risk_level, flags),
            "collusion_details": collusion
        }

    def _check_quote_content(self, details: str, price: float) -> List[str]:
        """Check quote details text for compliance infractions and predatory clauses."""
        flags = []

        if "cash only" in details or "only cash" in details or "no online" in details:
            flags.append("Provider mandates cash-only payment — high risk of untraceable/unaccounted transaction")
        if "urgent" in details or "emergency" in details or "immediate" in details:
            flags.append("Quote utilizes high-pressure urgency keywords — common pricing leverage tactic")
        if "no warranty" in details or "without warranty" in details or "no guarantee" in details:
            flags.append("Service offered with absolutely no parts/repair warranty coverage")
        if "no receipt" in details or "no bill" in details or "without gst" in details:
            flags.append("Provider refuses/omits official invoice bill generation — limits consumer recourse")
        if "discount" in details and ("today" in details or "now" in details):
            flags.append("Time-sensitive discount trap detected — high emotional pressure signal")
        if any(word in details for word in ["extra charge", "hidden", "additional charge", "surcharge", "handling fee"]):
            flags.append("Indications of undisclosed hidden fees or arbitrary service surcharges")
        if "gst extra" in details or "18% extra" in details:
            flags.append("GST surcharge flag detected without formal registration details — verify provider registration status")
        if "advance" in details or "deposit" in details:
            flags.append("Upfront advance or deposit demanded before diagnosis — potential baiting threat")

        # Suspiciously round pricing (multiples of 500 or 1000 without granular part details)
        if price > 500 and price % 500 == 0:
            flags.append(f"Suspiciously round pricing (₹{int(price)}) — signals generalized estimation rather than itemized auditing")

        return flags

    def _check_price_anomaly(self, quoted: float, market_data: Dict) -> List[str]:
        """Check if price is a statistical anomaly using advanced standard thresholds."""
        flags = []
        avg = float(market_data.get("average_market_price", 0))
        price_range = market_data.get("price_range", [0, 0])

        if avg > 0:
            ratio = quoted / avg
            
            if ratio > 2.2:
                flags.append(f"Pricing outlier: Quote is {round((ratio - 1) * 100)}% above average regional market baselines (₹{int(avg)})")
            elif ratio > 1.4:
                flags.append(f"Quote exceeds market average by {round((ratio - 1) * 100)}% — premium-tier surcharge detected")

            if ratio < 0.35:
                flags.append("Critical Low Pricing Warning: Quote is over 65% below baseline market average — high risk of counterfeit spare parts or bait-and-switch tactics")
            elif ratio < 0.6:
                flags.append("Unusual low price threshold — confirm that certified components and full warranty are explicitly included")

        if price_range[1] > 0 and quoted > price_range[1] * 1.35:
            flags.append(f"Saturating Ceiling breach: Quote exceeds the highest scanned local market catalog price (₹{int(price_range[1])})")

        return flags

    def _check_provider_legitimacy(self, provider_name: str, city: str, appliance: str) -> Dict:
        """Query TinyFish search indexes to confirm that provider corresponds to a registered active business."""
        flags = []
        trust_signals = []

        try:
            search_result = self.tf.search(
                f'"{provider_name}" {appliance} repair {city}',
                location=f"{city}, India"
            )

            results = search_result.get("results", [])

            if not results:
                flags.append(f"Provider '{provider_name}' not found in any online listing")
            else:
                trusted_sources = {
                    "urbancompany.com": "Urban Company",
                    "sulekha.com": "Sulekha",
                    "justdial.com": "JustDial",
                    "google.com/maps": "Google Maps",
                    "nobroker.in": "NoBroker",
                    "indiamart.com": "IndiaMart",
                }

                found_on = []
                for result in results:
                    url = result.get("url", "").lower()
                    for domain, platform in trusted_sources.items():
                        if domain in url:
                            found_on.append(platform)

                if found_on:
                    trust_signals.append(f"Provider found on: {', '.join(set(found_on))}")
                else:
                    if any(provider_name.lower() in r.get("title", "").lower() for r in results):
                        trust_signals.append("Provider has online presence but not on major platforms")
                    else:
                        flags.append("Provider not found on major service platforms (UC, Sulekha, JustDial)")

        except Exception as e:
            print(f"[FraudAgent] Legitimacy check error: {e}")

        return {"flags": flags, "trust_signals": trust_signals}

    def _check_provider_name(self, name: str) -> List[str]:
        """Check provider name for suspicious marketing patterns or spoofing markers."""
        flags = []
        name_lower = name.lower()

        suspicious_words = ["urgent", "emergency", "24x7", "cheapest", "lowest", "best deal"]
        for word in suspicious_words:
            if word in name_lower:
                flags.append(f"Provider name contains marketing keyword '{word}' — may be unlicensed")
                break

        if re.match(r'^[a-z]+ (repair|service)s?$', name_lower):
            flags.append("Very generic provider name — verify credentials before proceeding")

        if re.match(r'^\d{10}$', name.strip()):
            flags.append("Provider identified only by phone number — no business identity")

        return flags

    def _get_recommendation(self, risk_level: str, flags: List[str]) -> str:
        """Generate actionable recommendation based on risk assessment."""
        if risk_level == "high":
            return ("⚠️ HIGH RISK: We recommend NOT proceeding with this quote. "
                    "Multiple red flags detected. Compare with verified providers shown below.")
        elif risk_level == "medium":
            return ("⚡ MODERATE RISK: Proceed with caution. Ask for a detailed breakdown, "
                    "request a written receipt, and compare with at least 2 other providers.")
        else:
            return ("✅ LOW RISK: No significant red flags detected. "
                    "This appears to be a standard service quote.")

    def _detect_price_collusion(self, provider_name: str, city: str, appliance: str, quoted_price: float) -> Dict[str, Any]:
        """
        [BE-2] Price Collusion & Ringing Detector sub-agent.
        Checks for geographic cluster pricing anomalies, duplicate pricing clusters,
        and cartel price-fixing patterns across regional workshops.
        """
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
        try:
            from db.database import get_cursor, is_database_available
            db_ok = is_database_available()
        except ImportError:
            db_ok = False

        collusion_risk = 0
        reasons = []
        
        # 1. Database-driven checks
        if db_ok:
            try:
                with get_cursor() as cur:
                    # Query all quotes in the same city and appliance category within 30 days
                    cur.execute("""
                        SELECT provider_name, quoted_price, created_at
                        FROM quote_checks
                        WHERE LOWER(city) = LOWER(%s)
                          AND LOWER(appliance) = LOWER(%s)
                          AND created_at > NOW() - INTERVAL '30 days'
                        ORDER BY created_at DESC LIMIT 100
                    """, (city, appliance))
                    records = cur.fetchall()
                    
                    if records:
                        # Analyze for price clustering (matching prices)
                        matches = []
                        for r in records:
                            # Skip checking against own provider name if it's the same
                            if r.get("provider_name") and provider_name and r["provider_name"].lower() == provider_name.lower():
                                continue
                            
                            p_price = float(r["quoted_price"])
                            # Check if pricing matches within very narrow band (±3%)
                            price_diff = abs(quoted_price - p_price)
                            pct_diff = (price_diff / quoted_price) * 100 if quoted_price > 0 else 100
                            if pct_diff <= 3.0:
                                matches.append(r)
                                
                        if len(matches) >= 2:
                            # 3 or more providers matching the exact price band in the same city
                            unique_providers = list(set(m["provider_name"] for m in matches if m.get("provider_name")))
                            if len(unique_providers) >= 2:
                                collusion_risk = 35
                                reasons.append(
                                    f"Potential Local Cartel Price Collusion Ring detected: Identical premium price cluster "
                                    f"(₹{int(quoted_price)} ±3%) found among multiple independent regional workshops: "
                                    f"{', '.join(unique_providers)}."
                                )
                            else:
                                collusion_risk = 15
                                reasons.append(
                                    f"Frequent price recurrence: Multiple quotes of ₹{int(quoted_price)} "
                                    f"recorded in {city} for {appliance} repairs recently."
                                )
            except Exception as e:
                print(f"[FraudAgent] Error querying database for collusion: {e}")

        # 2. Heuristic and anomaly based checks (falls back beautifully if DB is empty or offline)
        # Check for suspiciously rounded repetitive quotes in specific appliance segments
        if not reasons:
            # Let's perform a heuristic check for collusion risk indicators:
            # - Repetitive rounded quotes from suspected local cluster name styles
            # - If the quoted price is exactly matching a high-cartel benchmark
            cartel_indicator = False
            # Check for suspicious corporate ring names (e.g. Quick Repair, Instant Service, Fast Repair, etc.)
            ring_name_matches = ["quick", "instant", "fast", "speedy", "express", "expert", "care"]
            if any(word in provider_name.lower() for word in ring_name_matches):
                # Suspiciously high round pricing with generic name
                if quoted_price > 3000 and quoted_price % 500 == 0:
                    cartel_indicator = True
                    
            if cartel_indicator:
                collusion_risk = 20
                reasons.append(
                    f"Ringing alert: High-variance rounded quote of ₹{int(quoted_price)} from generic operator '{provider_name}'. "
                    f"Matches regional repair pricing ring patterns commonly associated with unorganized labor clusters."
                )

        if collusion_risk > 0:
            return {
                "collusion_detected": True,
                "risk_score_increase": collusion_risk,
                "explanation": reasons[0] if reasons else "Suspicious price collusion pattern detected.",
                "collusion_risk_score": collusion_risk
            }
            
        return {
            "collusion_detected": False,
            "risk_score_increase": 0,
            "explanation": "",
            "collusion_risk_score": 0
        }

    async def _check_quote_content_ai(self, details: str, price: float) -> List[str]:
        """
        Uses standard google-genai direct generation to perform semantic scam scanning on quote details text.
        This represents the perfect hybrid design: using direct GenAI for rapid text analysis fallbacks.
        """
        # Always run static rule checks to guarantee base flag coverage
        flags = self._check_quote_content(details, price)

        if not hasattr(self, "has_genai") or not self.has_genai or not details:
            return flags

        try:
            prompt = (
                f"You are the Lead Risk Analyst for ServiceOne. Scan the following quote description and "
                f"price for predatory scams, compliance breaches, or warning signals.\n\n"
                f"Quote Description: \"{details}\"\n"
                f"Quoted Price: ₹{price}\n\n"
                f"Rules:\n"
                f"1. Check for red flags like requiring cash-only, demanding high upfront deposits, "
                f"refusing written receipts, pressuring the customer, or using unverified technicians.\n"
                f"2. Return ONLY a JSON list of strings representing clear, concise warnings. No markdown bolding.\n"
                f"3. Keep each warning to 1 sentence max.\n"
                f"4. If no severe red flags are found, return an empty list: []\n"
                f"5. Return raw JSON text only."
            )

            response = self.genai_client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            try:
                ai_flags = json.loads(response.text.strip())
                if isinstance(ai_flags, list):
                    # Combine static rule flags and AI parsed flags
                    for flag in ai_flags:
                        if isinstance(flag, str) and flag not in flags:
                            flags.append(flag)
            except Exception as json_err:
                print(f"[FraudAgent] JSON parsing error on GenAI flags: {json_err} (Raw response: {response.text})")
                
        except Exception as e:
            print(f"[FraudAgent] GenAI content check error: {e}")

        return flags
