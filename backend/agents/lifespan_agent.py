"""
LifespanAnalyzerAgent — Predicts remaining useful life and calculates a Repair vs. Replace index.
Hybrid-Intelligence Pattern: Uses Google ADK for structured multi-agent boardroom orchestration,
and Google GenAI SDK for blazing-fast natural-language user UI insights.
"""
import os
import random
from typing import Dict, Any
from google import adk
from google.adk.tools import FunctionTool
from google import genai
from google.genai import types

# Average design life of home appliances in years
APPLIANCE_DESIGN_LIFE = {
    "Air Conditioner": 10.0,
    "Refrigerator": 12.0,
    "Washing Machine": 9.0,
    "Television": 8.0,
    "Microwave": 7.0,
    "Water Purifier": 6.0,
    "Air Cooler": 5.0,
    "Geyser": 8.0
}

# Average cost of buying a new appliance in INR
APPLIANCE_REPLACEMENT_COST = {
    "Air Conditioner": 38000,
    "Refrigerator": 28000,
    "Washing Machine": 22000,
    "Television": 25000,
    "Microwave": 12000,
    "Water Purifier": 14000,
    "Air Cooler": 8000,
    "Geyser": 10000
}

class LifespanAnalyzerAgent:
    """
    [BE-4] Predictive Appliance Lifespan Analyzer extension.
    Predicts remaining useful life (RUL) of home appliances based on brand reliability coefficients,
    age, usage wear factors, and repair history. Calculates a financially backed 'Repair vs. Replace' index.
    """
    def __init__(self):
        self.model_name = os.getenv("AGENT_MODEL_FLASH", "gemini-2.5-flash")
        
        # 1. Initialize standard Google GenAI client for rapid natural-language insights
        try:
            self.genai_client = genai.Client()
            self.has_genai = True
            print("[LifespanAnalyzerAgent] Google GenAI Client successfully initialized.")
        except Exception as e:
            print(f"[LifespanAnalyzerAgent] GenAI Client Init failed (falling back to default reasons): {e}")
            self.has_genai = False
            
        # 2. Register mathematical calculator as an official ADK FunctionTool
        self.calculator_tool = FunctionTool(self.analyze_lifespan)
        
        # 3. Instantiate official Google ADK Agent for boardroom / registry compatibility
        self.adk_agent = adk.Agent(
            name="LifespanAnalyzerAgent",
            description="Predicts remaining useful life (RUL) of appliances and recommends Repair vs. Replace decisions.",
            instruction=(
                "You are the Lead Predictive Asset Engineer for ServiceOne. "
                "Utilize appliance age, usage patterns, and previous failure counts to calculate standard useful life "
                "and generate financially backed recommendations on whether to repair or replace."
            ),
            tools=[self.calculator_tool],
            model=self.model_name
        )

    def analyze_lifespan(
        self, 
        appliance_type: str, 
        brand: str, 
        age_years: float, 
        usage_frequency: str = "Medium", 
        previous_repairs_count: int = 0,
        quoted_price: float = 0.0
    ) -> Dict[str, Any]:
        """
        Performs mathematical deterioration and financial modeling over appliance characteristics.
        """
        # 1. Base design life
        base_life = APPLIANCE_DESIGN_LIFE.get(appliance_type, 8.0)
        replacement_cost = APPLIANCE_REPLACEMENT_COST.get(appliance_type, 20000)
        
        # 2. Brand reliability coefficient
        brand_coeff = 1.0
        brand_lower = brand.lower()
        if "samsung" in brand_lower or "lg" in brand_lower:
            brand_coeff = 1.05  # Highly reliable
        elif "whirlpool" in brand_lower or "panasonic" in brand_lower:
            brand_coeff = 1.02
        elif "unverified" in brand_lower or "generic" in brand_lower:
            brand_coeff = 0.85  # Generic wears out quicker
            
        # 3. Usage frequency scaling factor
        usage_factor = 1.0
        if usage_frequency.lower() == "high":
            usage_factor = 1.25 # 25% faster wear
        elif usage_frequency.lower() == "low":
            usage_factor = 0.80 # 20% slower wear
            
        # 4. Previous repair penalty
        repair_penalty = previous_repairs_count * 0.45 # 0.45 years lost per previous major repair
        
        # Calculate Remaining Useful Life (RUL)
        wear_accumulated = (age_years * usage_factor) / brand_coeff
        remaining_life = max(0.1, (base_life - wear_accumulated - repair_penalty))
        
        # Calculate reliability score remaining (percentage)
        reliability_pct = max(5, int((remaining_life / base_life) * 100))
        
        # 5. Financial Repair vs Replace Decision (The 50% Rule)
        price_ratio = (quoted_price / replacement_cost) if replacement_cost > 0 else 0.5
        age_ratio = (age_years / base_life) if base_life > 0 else 0.5
        
        decision = "Repair"
        recommendation_reason = "The repair cost is reasonably low compared to buying a brand new model."
        
        if price_ratio >= 0.5 and age_ratio >= 0.5:
            decision = "Replace"
            recommendation_reason = (
                f"Your {appliance_type} is at {int(age_ratio*100)}% of its design life and the repair costs "
                f"{int(price_ratio*100)}% of a new replacement. Financially, buying a new unit is highly recommended."
            )
        elif price_ratio >= 0.65:
            decision = "Replace"
            recommendation_reason = (
                f"Even though the appliance is relatively young, the repair quote (₹{int(quoted_price)}) is extremely high "
                f"({int(price_ratio*100)}% of replacement). Purchasing a new appliance with warranty is a smarter choice."
            )
        elif age_ratio >= 0.85:
            decision = "Replace"
            recommendation_reason = (
                f"The appliance is nearing the end of its typical lifespan ({int(age_ratio*100)}%). "
                f"While this repair is affordable, future breakdowns are highly likely. We suggest upgrade options."
            )
        else:
            if previous_repairs_count >= 3:
                decision = "Replace"
                recommendation_reason = (
                    f"This appliance has broken down {previous_repairs_count} times previously. "
                    "This is a chronic failure pattern; replacement is more cost-efficient in the long run."
                )
                
        return {
            "appliance_type": appliance_type,
            "brand": brand,
            "age_years": age_years,
            "typical_lifespan_years": base_life,
            "predicted_remaining_years": round(remaining_life, 1),
            "current_health_score": reliability_pct,
            "approx_replacement_cost_inr": replacement_cost,
            "repair_vs_replace": {
                "recommendation": decision,
                "reason": recommendation_reason,
                "repair_cost_percentage": round(price_ratio * 100, 1),
                "age_spent_percentage": round(age_ratio * 100, 1)
            }
        }

    async def generate_pro_insights(self, metrics: Dict[str, Any]) -> str:
        """
        Uses google-genai direct content generation to write highly personalized, premium
        and professional recommendation summaries based on mathematically computed wear metrics.
        This represents the perfect hybrid design: using direct GenAI for rapid-response UI text.
        """
        if not self.has_genai:
            return metrics["repair_vs_replace"]["reason"]
            
        try:
            prompt = (
                f"As the Lead ServiceOne Asset Engineer, write a short, highly professional, and encouraging "
                f"summary recommending whether to repair or replace a {metrics['brand']} {metrics['appliance_type']}. "
                f"Calculated Metrics:\n"
                f"- Appliance Age: {metrics['age_years']} years\n"
                f"- Typical Lifespan: {metrics['typical_lifespan_years']} years\n"
                f"- Predicted Remaining Life: {metrics['predicted_remaining_years']} years\n"
                f"- Current Health Score: {metrics['current_health_score']}/100\n"
                f"- Repair Cost vs. Replacement Cost: {metrics['repair_vs_replace']['repair_cost_percentage']}%\n"
                f"- Suggested Recommendation: {metrics['repair_vs_replace']['recommendation']}\n\n"
                f"Rules:\n"
                f"1. Explain the financial or engineering rationale clearly and concisely.\n"
                f"2. Keep it to 2-3 sentences max.\n"
                f"3. Make it feel extremely premium and helpful."
            )
            
            response = self.genai_client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"[LifespanAnalyzerAgent] GenAI generate_pro_insights error: {e}")
            return metrics["repair_vs_replace"]["reason"]
