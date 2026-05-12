"""
AnalyzerAgent — Cross-validates quoted prices against REAL market data.
Uses TinyFish-sourced prices, location signals, and statistical analysis.
Refactored to be fully compliant with the Google ADK (Agent Development Kit) framework.
"""
import os
import math
from typing import Dict, Any, List
from datetime import datetime
from google import adk
from google.adk.tools import FunctionTool
from google import genai
from google.genai import types


class AnalyzerAgent:
    def __init__(self):
        self.model_name = os.getenv("AGENT_MODEL_FLASH", "gemini-2.5-flash")

        # 1. Initialize standard Google GenAI client for speed and unstructured content generation
        try:
            self.genai_client = genai.Client()
            self.has_genai = True
            print("[AnalyzerAgent] Google GenAI Client successfully initialized.")
        except Exception as e:
            print(f"[AnalyzerAgent] GenAI Client Init failed (falling back to static heuristics): {e}")
            self.has_genai = False

        # 2. Register statistical analysis as an official ADK FunctionTool
        self.statistical_tool = FunctionTool(self._run_statistical_math)

        # 3. Instantiate the Google ADK Agent for boardroom / orchestrator coordination
        self.adk_agent = adk.Agent(
            name="AnalyzerAgent",
            description="Performs mathematical cross-validation and standard deviation analysis on local repair quotes.",
            instruction=(
                "You are the Lead Math Statistician for ServiceOne. "
                "Use the provided statistical tools to calculate pricing confidence, variance, and Z-scores."
            ),
            tools=[self.statistical_tool],
            model=self.model_name
        )


    def _run_statistical_math(self, quoted_price: float, avg_market_price: float, col_index: float,
                              price_range: List[float], all_prices: List[float], density_adj: float,
                              logistic_complexity: float, appliance_type: str = "") -> Dict[str, Any]:
        """Perform advanced statistical modeling, standard deviation, Z-scores, and CI boundaries."""
        # [BE-1] Dynamic Regional Demand Pricing Grounding
        current_month = datetime.now().month
        app_lower = appliance_type.lower() if appliance_type else ""
        demand_multiplier = 1.0
        demand_reason = "Standard baseline demand pricing."

        # Summer surge (April, May, June, July) for AC/cooling appliances
        if current_month in [4, 5, 6, 7] and any(x in app_lower for x in ["ac", "air conditioner", "refrigerator", "fridge", "cooler"]):
            demand_multiplier = 1.22
            demand_reason = "High Summer Heatwave Surge (increased demand for cooling technician slots)."
        # Monsoon dampness surge (August, September) for washing machines / electronics
        elif current_month in [8, 9] and any(x in app_lower for x in ["wash", "dryer", "electronic"]):
            demand_multiplier = 1.15
            demand_reason = "Monsoon Dampness surge (increased electrical/motor moisture failures)."
        # Festive season peak surge (October, November) for all repair categories (Diwali/holiday labor crunch)
        elif current_month in [10, 11]:
            demand_multiplier = 1.12
            demand_reason = "Festive Diwali Surge (reduced technician availability and high household service demand)."

        # Localize and Adjust Market Baseline Price
        adjusted_market_price = avg_market_price * col_index * density_adj * (0.9 + 0.1 * logistic_complexity) * demand_multiplier
        
        # Determine fair boundaries with cost offsets
        raw_min = price_range[0] if (len(price_range) > 0 and price_range[0]) else avg_market_price * 0.75
        raw_max = price_range[1] if (len(price_range) > 1 and price_range[1]) else avg_market_price * 1.30
        
        adjusted_range_min = raw_min * col_index * density_adj * demand_multiplier
        adjusted_range_max = raw_max * col_index * density_adj * demand_multiplier

        # Advanced Statistical Calculations
        if len(all_prices) >= 3:
            mean = sum(all_prices) / len(all_prices)
            variance_sum = sum((x - mean) ** 2 for x in all_prices)
            std_dev = math.sqrt(variance_sum / len(all_prices))
            if std_dev == 0:
                std_dev = adjusted_market_price * 0.18
        else:
            std_dev = adjusted_market_price * 0.18 # Fallback Standard Deviation (18% market spread)

        # Calculate Statistical Z-Score
        if std_dev > 0:
            z_score = (quoted_price - adjusted_market_price) / std_dev
        else:
            z_score = 0.0

        # Calculate 95% Confidence Interval margins for market averages
        margin_of_error = 1.96 * (std_dev / math.sqrt(max(len(all_prices), 1)))
        ci_95_lower = max(100, adjusted_market_price - margin_of_error)
        ci_95_upper = adjusted_market_price + margin_of_error

        # Calculate variance percentage
        variance_pct = 0
        if adjusted_market_price > 0:
            variance_pct = ((quoted_price - adjusted_market_price) / adjusted_market_price) * 100

        # Determine pricing boundaries and pricing safety
        is_overpriced = quoted_price > (adjusted_market_price * 1.22) or z_score > 1.65
        is_underpriced = quoted_price < (adjusted_market_price * 0.65) or z_score < -1.80
        is_fair = not is_overpriced and not is_underpriced

        return {
            "adjusted_market_price": adjusted_market_price,
            "adjusted_range_min": adjusted_range_min,
            "adjusted_range_max": adjusted_range_max,
            "std_dev": std_dev,
            "z_score": z_score,
            "ci_95_lower": ci_95_lower,
            "ci_95_upper": ci_95_upper,
            "variance_pct": variance_pct,
            "is_overpriced": is_overpriced,
            "is_underpriced": is_underpriced,
            "is_fair": is_fair,
            "demand_multiplier": demand_multiplier,
            "demand_reason": demand_reason,
            "status": "success"
        }

    async def analyze(self, quote: Dict[str, Any], location_data: Dict[str, Any], 
                       market_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mathematical cross-validation of quoted price against real market data.
        Generates confidence score, variance analysis, standard deviations, Z-score, and actionable insights.
        """
        quoted_price = float(quote.get("quoted_price", 0))
        avg_market_price = float(market_data.get("average_market_price", 0))
        col_index = float(location_data.get("cost_of_living_index", 1.0))
        price_range = market_data.get("price_range", [0, 0])
        all_prices = market_data.get("all_prices_found", [])
        sources_count = market_data.get("sources_scraped", 0)
        competitor_density = location_data.get("competitor_density", "Medium")
        density_adj = float(location_data.get("density_adjustment_factor", 1.0))
        logistic_complexity = float(location_data.get("logistic_complexity_score", 1.0))
        appliance_type = quote.get("appliance_type", "")

        # 1. Run the math tool
        stats = self._run_statistical_math(
            quoted_price=quoted_price,
            avg_market_price=avg_market_price,
            col_index=col_index,
            price_range=price_range,
            all_prices=all_prices,
            density_adj=density_adj,
            logistic_complexity=logistic_complexity,
            appliance_type=appliance_type
        )

        adjusted_market_price = stats["adjusted_market_price"]
        adjusted_range_min = stats["adjusted_range_min"]
        adjusted_range_max = stats["adjusted_range_max"]
        std_dev = stats["std_dev"]
        z_score = stats["z_score"]
        ci_95_lower = stats["ci_95_lower"]
        ci_95_upper = stats["ci_95_upper"]
        variance_pct = stats["variance_pct"]
        is_overpriced = stats["is_overpriced"]
        is_underpriced = stats["is_underpriced"]
        is_fair = stats["is_fair"]

        # Calculate confidence score based on data quality
        confidence = self._calculate_confidence(
            sources_count, len(all_prices), market_data.get("status", ""), competitor_density
        )

        # Calculate potential savings
        potential_savings = max(0, quoted_price - adjusted_market_price) if is_overpriced else 0

        fair_range_min = round(adjusted_range_min)
        fair_range_max = round(adjusted_range_max)

        # Dynamic local cost factors breakdown
        fallback_breakdown = market_data.get("cost_breakdown", {})
        est_parts = fallback_breakdown.get("estimated_parts") or round(adjusted_market_price * 0.45)
        est_labor = fallback_breakdown.get("estimated_labor") or round(adjusted_market_price * 0.40)
        est_travel = round(adjusted_market_price * 0.15) if "Tier-1" in location_data.get("city_tier", "") else round(adjusted_market_price * 0.10)

        # Build complete analysis report
        analysis = {
            "adjusted_market_price": round(adjusted_market_price),
            "fair_range_min": fair_range_min,
            "fair_range_max": fair_range_max,
            "variance_percentage": round(variance_pct, 1),
            "is_overpriced": is_overpriced,
            "is_underpriced": is_underpriced,
            "is_fair": is_fair,
            "potential_savings": round(potential_savings),
            "confidence_score": confidence,
            "data_quality": self._assess_data_quality(sources_count, len(all_prices), market_data.get("status", "")),
            
            # Complex statistical parameters
            "statistical_metrics": {
                "standard_deviation": round(std_dev, 2),
                "z_score": round(z_score, 3),
                "ci_95_lower": round(ci_95_lower),
                "ci_95_upper": round(ci_95_upper),
                "sample_points_count": max(len(all_prices), 1)
            },

            "price_breakdown": {
                "quoted": quoted_price,
                "market_average": round(adjusted_market_price),
                "market_low": fair_range_min,
                "market_high": fair_range_max,
                "col_adjustment": col_index,
                "density_adjustment": round(density_adj, 2),
                "logistic_complexity": round(logistic_complexity, 2),
                "demand_multiplier": round(stats.get("demand_multiplier", 1.0), 2),
                "demand_reason": stats.get("demand_reason", "Standard baseline demand pricing."),
                "estimated_parts": est_parts,
                "estimated_labor": est_labor,
                "estimated_travel": est_travel,
                "variance": f"{'+' if variance_pct > 0 else ''}{round(variance_pct, 1)}%",
            },
            "insights": await self._generate_insights_ai(
                quoted_price, adjusted_market_price, variance_pct,
                is_overpriced, is_underpriced, competitor_density,
                sources_count, quote, stats.get("demand_multiplier", 1.0), stats.get("demand_reason", "")
            ),
            "warranty_check": self._check_brand_warranty(quote.get("brand", ""), quote.get("appliance_type", "")),
        }

        return analysis

    def _check_brand_warranty(self, brand: str, appliance_type: str) -> Dict[str, Any]:
        """Verify standard manufacturer warranty guidelines for Indian appliance brands."""
        if not brand or not appliance_type:
            return {"supported": False, "message": "Specify appliance brand to check standard warranty coverage."}
            
        b = brand.lower().strip()
        app = appliance_type.lower().strip()
        
        # Mapping of standard Indian manufacturer warranty policies
        policies = {
            "ac": {
                "lg": "1 Year Comprehensive + 10 Years on Compressor (with gas charging coverage in first year)",
                "samsung": "1 Year Comprehensive + 10 Years on Digital Inverter Compressor",
                "daikin": "1 Year Comprehensive + 5 Years on PCB + 10 Years on Compressor",
                "voltas": "1 Year Comprehensive + 10 Years on Compressor",
                "blue star": "1 Year Comprehensive + 10 Years on Compressor",
                "default": "1 Year Comprehensive + 5 to 10 Years on Compressor"
            },
            "refrigerator": {
                "lg": "1 Year Comprehensive + 10 Years on Smart Inverter Compressor",
                "samsung": "1 Year Comprehensive + 10 Years on Digital Inverter Compressor",
                "whirlpool": "1 Year Comprehensive + 10 Years on Compressor",
                "godrej": "1 Year Comprehensive + 10 Years on Compressor",
                "default": "1 Year Comprehensive + 10 Years on Compressor"
            },
            "washing machine": {
                "ifb": "4 Years Comprehensive Warranty + 10 Years Motor Support",
                "lg": "2 Years Comprehensive + 10 Years Motor Warranty",
                "samsung": "2 Years Comprehensive + 10 Years on Digital Inverter Motor",
                "whirlpool": "2 Years Comprehensive + 10 Years Motor Warranty",
                "bosch": "2 Years Comprehensive + 10 Years Motor Warranty",
                "default": "1 to 2 Years Comprehensive + 10 Years Motor Warranty"
            },
            "microwave": {
                "lg": "1 Year Comprehensive + 5 Years on Magnetron",
                "samsung": "1 Year Comprehensive + 5 Years on Magnetron",
                "ifb": "1 Year Comprehensive + 3 Years on Magnetron",
                "default": "1 Year Comprehensive"
            }
        }
        
        app_key = None
        if "ac" in app or "air conditioner" in app or "cooler" in app:
            app_key = "ac"
        elif "fridge" in app or "refrigerator" in app:
            app_key = "refrigerator"
        elif "washer" in app or "washing" in app:
            app_key = "washing machine"
        elif "microwave" in app or "oven" in app:
            app_key = "microwave"
            
        if not app_key:
            return {
                "supported": False,
                "message": "Warranty coverage is available for ACs, Refrigerators, Washing Machines, and Microwaves. Standard 1-year coverage applies for other units."
            }
            
        policy_set = policies[app_key]
        
        matched_brand = "default"
        for k in policy_set.keys():
            if k in b:
                matched_brand = k
                break
                
        coverage = policy_set[matched_brand]
        
        return {
            "supported": True,
            "brand": brand,
            "appliance_type": app_key.replace("_", " ").title(),
            "coverage_terms": coverage,
            "guidance_alert": f"If this {brand} {app_key.title()} is under active warranty, replacing major parts (compressors, motors, or PCBs) is 100% FREE or highly discounted from authorized service centers."
        }

    def _calculate_confidence(self, sources: int, price_count: int, 
                                status: str, density: str) -> float:
        """Calculate confidence score (0-1) based on data quality signals."""
        score = 0.5

        if sources >= 5:
            score += 0.2
        elif sources >= 3:
            score += 0.1

        if price_count >= 10:
            score += 0.15
        elif price_count >= 5:
            score += 0.1
        elif price_count >= 2:
            score += 0.05

        if status == "success":
            score += 0.1
        elif status == "cached":
            score += 0.08
        elif status == "fallback":
            score -= 0.15

        if density == "High":
            score += 0.05

        return round(min(max(score, 0.1), 0.99), 2)

    def _assess_data_quality(self, sources: int, prices: int, status: str) -> str:
        """Assess overall data quality for display."""
        if status == "fallback":
            return "low — using baseline estimates, limited live data available"
        if sources >= 5 and prices >= 8:
            return "high — multiple verified sources with consistent pricing data"
        if sources >= 3 and prices >= 4:
            return "medium — several sources analyzed, reasonable price confidence"
        return "moderate — limited sources, results may vary"

    def _generate_insights(self, quoted: float, market_avg: float, variance: float,
                            overpriced: bool, underpriced: bool, density: str,
                            sources: int, quote: Dict, demand_multiplier: float = 1.0,
                            demand_reason: str = "") -> list:
        """Generate human-readable insights about the quote."""
        insights = []
        appliance = quote.get("appliance_type", "appliance")
        service = quote.get("service_type", "service")
        brand = quote.get("brand", "")
        city = quote.get("user_zip_code", "your area")

        # Seasonal / Holiday surge details
        if demand_multiplier > 1.0:
            insights.append(
                f"📈 SEASONAL SURGE DETECTED ({int((demand_multiplier - 1.0) * 100)}% adjustment): "
                f"{demand_reason}"
            )

        if overpriced:
            insights.append(
                f"Your quote of ₹{int(quoted)} is {abs(round(variance))}% above the market average of ₹{int(market_avg)} "
                f"for {brand} {appliance} {service} in {city}."
            )
            savings = int(quoted - market_avg)
            insights.append(f"You could potentially save ₹{savings} by comparing with other providers.")
            
            if density == "High":
                insights.append("There are many service providers in your area — competition should keep prices reasonable.")
            
        elif underpriced:
            insights.append(
                f"Your quote of ₹{int(quoted)} is unusually low ({abs(round(variance))}% below market average). "
                f"This might indicate compromised parts or service quality."
            )
            insights.append("We recommend verifying the provider's credentials and asking about warranty terms.")
            
        else:
            insights.append(
                f"Your quote of ₹{int(quoted)} is within the fair market range (₹{int(market_avg * 0.75)} – ₹{int(market_avg * 1.25)}) "
                f"for {brand} {appliance} {service} in {city}."
            )
            insights.append("This appears to be a competitive price. The provider's rate aligns with current market conditions.")

        if sources >= 5:
            insights.append(f"Analysis based on {sources} verified sources including Urban Company, Sulekha, and local listings.")

        return insights

    async def _generate_insights_ai(self, quoted: float, market_avg: float, variance: float,
                                    overpriced: bool, underpriced: bool, density: str,
                                    sources: int, quote: Dict, demand_multiplier: float = 1.0,
                                    demand_reason: str = "") -> list:
        """
        Generates hyper-intelligent, context-aware user insights by utilizing the direct google-genai SDK,
        leveraging high-performance generation to deliver custom engineering guidance.
        """
        if not hasattr(self, "has_genai") or not self.has_genai:
            return self._generate_insights(quoted, market_avg, variance, overpriced, underpriced, density, sources, quote, demand_multiplier, demand_reason)

        try:
            prompt = (
                f"You are the Lead Cost Estimator & Math Analyst for ServiceOne. Write 3 highly useful, practical, "
                f"and mathematically grounded insights for a customer who got a repair quote.\n\n"
                f"Data Indicators:\n"
                f"- Appliance: {quote.get('brand', '')} {quote.get('appliance_type', 'appliance')}\n"
                f"- Service Required: {quote.get('service_type', 'repair')}\n"
                f"- User Region: {quote.get('user_zip_code', 'India')}\n"
                f"- Quoted Rate: ₹{int(quoted)}\n"
                f"- Fair Market Average: ₹{int(market_avg)}\n"
                f"- Variance: {'+' if variance > 0 else ''}{round(variance, 1)}%\n"
                f"- Overpriced Check: {overpriced}\n"
                f"- Underpriced Check: {underpriced}\n"
                f"- Regional Competitor Density: {density}\n"
                f"- Scanned Online Sources: {sources}\n"
                f"- Seasonal Surge Factor: {demand_multiplier}x ({demand_reason if demand_multiplier > 1.0 else 'None'})\n\n"
                f"Rules:\n"
                f"1. Generate exactly 3 bullet points.\n"
                f"2. Each bullet point must be a single line of concise, high-utility guidance (no markdown bold headings inside bullet points, keep text sleek).\n"
                f"3. Focus on explaining the variance, advising on regional competition, and warning about potential part counterfeit risks if underpriced or savings if overpriced.\n"
                f"4. Be authoritative and polite. Return plain bullet text."
            )

            response = self.genai_client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            
            # Clean and parse bullet points
            lines = [line.strip().lstrip("*-• ").strip() for line in response.text.split("\n") if line.strip()]
            cleaned_bullets = [line for line in lines if len(line) > 10][:3]
            if len(cleaned_bullets) >= 2:
                return cleaned_bullets
            return self._generate_insights(quoted, market_avg, variance, overpriced, underpriced, density, sources, quote, demand_multiplier, demand_reason)
        except Exception as e:
            print(f"[AnalyzerAgent] GenAI error: {e}")
            return self._generate_insights(quoted, market_avg, variance, overpriced, underpriced, density, sources, quote, demand_multiplier, demand_reason)
