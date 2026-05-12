"""
ReceiptParserAgent — Parses uploaded documents, invoices, or manual text sheets using Multimodal Gemini Vision.
Fully compliant with the Google ADK (Agent Development Kit) framework.
"""
import os
import json
from typing import Dict, Any, List
from google import adk
from google.adk.tools import FunctionTool
from google import genai
from google.genai import types


class ReceiptParserAgent:
    def __init__(self):
        # Vision tasks are best served by gemini-2.5-flash
        self.model_name = os.getenv("AGENT_MODEL_FLASH", "gemini-2.5-flash")

        # Initialize official Google GenAI client configured to run on Vertex AI
        try:
            self.vertex_client = genai.Client(
                vertexai=True,
                project=os.getenv("GCP_PROJECT_ID", "service-one-platform"),
                location=os.getenv("GCP_REGION", "us-central1")
            )
            self.has_vertex = True
            print("[ReceiptParserAgent] Vertex AI Google GenAI Client successfully initialized.")
        except Exception as e:
            print(f"[ReceiptParserAgent] Vertex AI Initialization failed (falling back to heuristics): {e}")
            self.has_vertex = False

        # 1. Register extraction methods as official ADK FunctionTools
        self.raw_parser_tool = FunctionTool(self._parse_raw_text)

        # 2. Instantiate the Google ADK Agent
        self.adk_agent = adk.Agent(
            name="ReceiptParserAgent",
            description="Extracts brand, model, parts, capacity, and gas details from invoices (Images, PDFs, Text).",
            instruction=(
                "You are the Lead Multimodal Document Specialist for ServiceOne. "
                "Examine invoice structures, line-item pricing breakdowns, and part brand details."
            ),
            tools=[self.raw_parser_tool],
            model=self.model_name
        )

    def _parse_raw_text(self, text_dump: str) -> Dict[str, Any]:
        """Runs structural evaluation over raw text blocks to find key appliance specifications."""
        normalized = text_dump.lower()
        extracted = {
            "appliance_type": "ac" if "ac" in normalized or "condition" in normalized else "appliance",
            "brand": "Generic",
            "capacity": "Unknown",
            "gas_type": "Unknown",
            "parts_replaced": [],
            "labor_fee": 0.0,
            "materials_cost": 0.0,
            "quoted_price": 0.0,
            "provider_name": "Local Mechanic"
        }

        # Basic text heuristics (can be enhanced further via ADK and Gemini prompting)
        brands = ["lg", "samsung", "daikin", "voltas", "whirlpool", "hitachi", "carrier", "blue star"]
        for b in brands:
            if b in normalized:
                extracted["brand"] = b.title()
                break

        if "compressor" in normalized:
            extracted["parts_replaced"].append("compressor")
        if "capacitor" in normalized:
            extracted["parts_replaced"].append("capacitor")
        if "motor" in normalized:
            extracted["parts_replaced"].append("fan motor")

        if "r32" in normalized:
            extracted["gas_type"] = "R32"
        elif "r410" in normalized:
            extracted["gas_type"] = "R410A"
        elif "r22" in normalized:
            extracted["gas_type"] = "R22"

        return extracted

    async def analyze(self, file_path_or_text: str) -> Dict[str, Any]:
        """
        Receives document contents or file paths, executing multimodal scans.
        Returns a structured dictionary of parsed appliance and job specs.
        """
        # For simplicity and robust testing fallbacks, check if it's a file or string
        if os.path.exists(file_path_or_text):
            if self.has_vertex:
                try:
                    # Detect mime type based on file extension
                    ext = os.path.splitext(file_path_or_text)[1].lower()
                    mime_type = "image/jpeg"
                    if ext == ".png":
                        mime_type = "image/png"
                    elif ext == ".pdf":
                        mime_type = "application/pdf"
                    elif ext == ".webp":
                        mime_type = "image/webp"

                    with open(file_path_or_text, "rb") as f:
                        file_bytes = f.read()

                    # Define the structured multimodal parser prompt
                    prompt = (
                        "Analyze this receipt/invoice. Extract the following properties and return strictly "
                        "as a JSON object (no markdown, no backticks, just raw JSON):\n"
                        "{\n"
                        '  "appliance_type": "ac", "tv", "wm", "fridge", "ro", or "geyser",\n'
                        '  "brand": "Manufacturer brand name (e.g., Samsung, LG, Daikin, Voltas)",\n'
                        '  "quoted_price": Total cost / amount charged as a float (e.g., 1500.0),\n'
                        '  "provider_name": "Name of the repair shop or technician",\n'
                        '  "capacity": "Capacity of the appliance if specified (e.g., 1.5 Ton, 7 Kg)",\n'
                        '  "gas_type": "Refrigerant gas type if specified (e.g., R32, R410A, R22)",\n'
                        '  "parts_replaced": ["list of parts mentioned (e.g. compressor, capacitor)"],\n'
                        '  "labor_fee": labor or service charge,\n'
                        '  "materials_cost": cost of parts/materials\n'
                        "}\n"
                        "Ensure the keys exist. If a value is unknown, set it to a reasonable default or 'Unknown'."
                    )

                    response = self.vertex_client.models.generate_content(
                        model=self.model_name,
                        contents=[
                            types.Part.from_bytes(
                                data=file_bytes,
                                mime_type=mime_type
                            ),
                            prompt
                        ],
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json"
                        )
                    )

                    text_out = response.text.strip()
                    parsed = json.loads(text_out)
                    parsed["source_file"] = os.path.basename(file_path_or_text)
                    return parsed
                except Exception as e:
                    print(f"[ReceiptParserAgent] Multimodal OCR failed: {e}. Falling back to text-heuristics.")

            try:
                with open(file_path_or_text, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                parsed = self._parse_raw_text(content)
                parsed["source_file"] = os.path.basename(file_path_or_text)
                return parsed
            except Exception as e:
                return {"status": "error", "error": f"Failed to read file: {e}"}

        # Otherwise treat as raw text
        return self._parse_raw_text(file_path_or_text)
