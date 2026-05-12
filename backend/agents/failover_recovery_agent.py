"""
FailoverRecoveryAgent — Seamlessly injects baseline fallback data to prevent boardroom 500 errors.
Fully compliant with the Google ADK (Agent Development Kit) framework.
"""
import os
from typing import Dict, Any, List
from google import adk
from google.adk.tools import FunctionTool


class FailoverRecoveryAgent:
    def __init__(self):
        self.model_name = os.getenv("AGENT_MODEL_FLASH_LITE", "gemini-2.5-flash-lite")

        # 1. Register fallback tools as official ADK FunctionTools
        self.baseline_tool = FunctionTool(self._get_baseline_database_rates)

        # 2. Instantiate the Google ADK Agent
        self.adk_agent = adk.Agent(
            name="FailoverRecoveryAgent",
            description="Provides baseline regional fallback prices if external APIs or scrapers fail.",
            instruction=(
                "You are the Rescuer for the ServiceOne Boardroom. "
                "In the event of network failures or crawler blocks, serve safe, verified database baseline prices."
            ),
            tools=[self.baseline_tool],
            model=self.model_name
        )

    def _get_baseline_database_rates(self, appliance: str, service: str) -> Dict[str, Any]:
        """Provides default pricing matrix guidelines based on national averages in India."""
        # Baseline rates (in INR) representing national market estimates
        baselines = {
            "ac": {
                "repair": {"min": 1400.0, "max": 2200.0, "avg": 1800.0},
                "service": {"min": 500.0, "max": 900.0, "avg": 700.0},
                "gas_charge": {"min": 2200.0, "max": 3500.0, "avg": 2800.0}
            },
            "refrigerator": {
                "repair": {"min": 1200.0, "max": 2000.0, "avg": 1600.0},
                "service": {"min": 400.0, "max": 800.0, "avg": 600.0}
            },
            "washing_machine": {
                "repair": {"min": 1300.0, "max": 2100.0, "avg": 1700.0},
                "service": {"min": 450.0, "max": 750.0, "avg": 600.0}
            }
        }

        app_key = appliance.lower()
        srv_key = service.lower()

        # Handle matches
        if app_key in baselines:
            srv_matrix = baselines[app_key]
            if srv_key in srv_matrix:
                return srv_matrix[srv_key]
            return srv_matrix["repair"]  # Default service type fallback

        # Absolute catch-all
        return {"min": 1000.0, "max": 1800.0, "avg": 1400.0}

    async def analyze(self, quote_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Retrieves baseline pricing guidelines to rescue processing tasks.
        """
        appliance = quote_data.get("appliance_type", "ac")
        service = quote_data.get("service_type", "repair")

        baseline = self._get_baseline_database_rates(appliance, service)
        return {
            "status": "injected_fallback",
            "appliance_type": appliance,
            "service_type": service,
            "fallback_average": baseline["avg"],
            "fallback_min": baseline["min"],
            "fallback_max": baseline["max"]
        }
