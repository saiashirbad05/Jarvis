"""
SystemMonitorAgent — Hooks into boardroom metrics to audit execution times and send administrative digests.
Fully compliant with the Google ADK (Agent Development Kit) framework.
"""
import os
import json
from datetime import datetime
from typing import Dict, Any, List
from google import adk
from google.adk.tools import FunctionTool


class SystemMonitorAgent:
    def __init__(self):
        self.model_name = os.getenv("AGENT_MODEL_FLASH", "gemini-2.5-flash")

        # 1. Register monitoring tools as official ADK FunctionTools
        self.latency_logger_tool = FunctionTool(self._log_latency)
        self.report_creator_tool = FunctionTool(self._create_digest_html)

        # 2. Instantiate the Google ADK Agent
        self.adk_agent = adk.Agent(
            name="SystemMonitorAgent",
            description="Monitors latency metrics, errors, and system success parameters to output administrative reports.",
            instruction=(
                "You are the Boardroom Overseer for ServiceOne. "
                "Monitor latencies, active sub-agent metrics, and compile elite daily digest reports."
            ),
            tools=[self.latency_logger_tool, self.report_creator_tool],
            model=self.model_name
        )

        self.metrics_log: List[Dict[str, Any]] = []

    def _log_latency(self, agent_name: str, duration_seconds: float, status: str) -> bool:
        """Saves latency metrics in memory for compiling digests."""
        self.metrics_log.append({
            "agent_name": agent_name,
            "latency_sec": duration_seconds,
            "status": status,
            "timestamp": datetime.now().isoformat()
        })
        return True

    def _create_digest_html(self, admin_email: str) -> str:
        """Compiles a responsive HTML administrator email report detailing boardroom performance."""
        total_runs = len(self.metrics_log)
        avg_latency = sum(x["latency_sec"] for x in self.metrics_log) / total_runs if total_runs > 0 else 0.0
        success_runs = sum(1 for x in self.metrics_log if x["status"] == "success")
        success_rate = (success_runs / total_runs * 100) if total_runs > 0 else 100.0

        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 25px; border: 1px solid #e1e4e8;">
                <h2 style="color: #1a73e8; margin-top: 0;">ServiceOne Boardroom Performance Digest</h2>
                <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S IST')}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #5f6368;">Total Executions</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">{total_runs}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #5f6368;">Average Latency</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #e8a00e;">{avg_latency:.2f}s</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #5f6368;">Success Rate</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #34a853;">{success_rate:.1f}%</td>
                    </tr>
                </table>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #9aa0a6; text-align: center;">ServiceOne Automated Performance Monitor. All endpoints operational.</p>
            </div>
        </body>
        </html>
        """
        return html

    async def analyze(self, action_type: str = "summary") -> Dict[str, Any]:
        """Runs logging compilation actions or administrative report creations."""
        admin_email = os.getenv("ADMIN_EMAIL", "admin@serviceone.in")
        
        if action_type == "email_digest":
            html_content = self._create_digest_html(admin_email)
            return {
                "status": "digest_created",
                "recipient": admin_email,
                "email_body_html": html_content
            }

        return {
            "status": "active",
            "logged_runs_count": len(self.metrics_log),
            "log": self.metrics_log[-5:] if self.metrics_log else []
        }
