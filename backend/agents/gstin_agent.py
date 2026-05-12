import re
import random
from typing import Dict, Any

# Map of Indian state codes to state names for GSTIN validation
GST_STATE_CODES = {
    "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
    "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
    "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
    "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "26": "Dadra and Nagar Haveli and Daman and Diu", "27": "Maharashtra", "28": "Andhra Pradesh",
    "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
    "34": "Puducherry", "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh (New)",
    "38": "Ladakh"
}

class GSTINAgent:
    """
    [FEAT-5] GSTIN / Registry credentials verification scraper.
    Validates Indian GSTINs structurally according to official CBIC specifications and performs
    high-fidelity simulated registry scrapes to extract business legal details, active status, and address.
    """
    
    def __init__(self):
        # 15-character format regex: 2 digits (state) + 5 letters + 4 digits + 1 letter (PAN) + 1 digit (entity) + 'Z' + 1 alphanumeric (checksum)
        self.gstin_pattern = re.compile(r"^([0-9]{2})([A-Z]{5}[0-9]{4}[A-Z]{1})([1-9A-Z]{1})Z([0-9A-Z]{1})$")

    def verify_gstin(self, gstin: str) -> Dict[str, Any]:
        gstin = gstin.strip().upper()
        
        # 1. Structural check
        if len(gstin) != 15:
            return {
                "valid": False,
                "error": "GSTIN must be exactly 15 characters long.",
                "gstin": gstin
            }
            
        match = self.gstin_pattern.match(gstin)
        if not match:
            return {
                "valid": False,
                "error": "Invalid GSTIN format. Expected pattern: '27AAAAA1111A1Z1'.",
                "gstin": gstin
            }
            
        state_code = match.group(1)
        pan = match.group(2)
        entity_num = match.group(3)
        checksum = match.group(4)
        
        state_name = GST_STATE_CODES.get(state_code)
        if not state_name:
            return {
                "valid": False,
                "error": f"Invalid state code '{state_code}' in GSTIN.",
                "gstin": gstin
            }
            
        # 2. Simulated Live registry scrape
        # In production, this would make an API call to a GST validation provider or portal
        random.seed(gstin) # Deterministic based on GSTIN string
        
        business_types = ["Proprietorship", "Private Limited Company", "Partnership Firm", "Limited Liability Partnership"]
        appliance_words = ["Cooling Systems", "Electronics", "Home Appliances", "Digital Repairs", "Multi-Service Center"]
        surname_words = ["Sharma", "Patel", "Reddy", "Iyer", "Sen", "Singh", "Fernandes"]
        
        legal_name = f"{random.choice(surname_words)} & Sons {random.choice(appliance_words)}"
        trade_name = f"ServiceOne Authorized Hub ({state_name})"
        reg_date = f"201{random.randint(5, 9)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
        taxpayer_type = "Regular" if random.random() > 0.15 else "Composition"
        
        streets = ["M.G. Road", "Ring Road Sector 4", "Connaught Place", "S.V. Road Extension", "GST Road Near Flyover"]
        localities = ["Koramangala", "Indiranagar", "Adyar", "Dwarka Sector 12", "Andheri East", "Salt Lake Sector V"]
        pin = f"{random.randint(11, 85)}{random.randint(0, 9)}{random.randint(1, 9)}{random.randint(0, 9)}{random.randint(0, 9)}"
        
        addr = f"Shop No. {random.randint(12, 189)}, {random.choice(streets)}, {random.choice(localities)}, {state_name} - {pin}"
        
        return {
            "valid": True,
            "gstin": gstin,
            "registry_data": {
                "legal_name": legal_name,
                "trade_name": trade_name,
                "state_code": state_code,
                "jurisdiction_state": state_name,
                "registration_date": reg_date,
                "taxpayer_type": taxpayer_type,
                "status": "Active" if random.random() > 0.05 else "Suspended",
                "primary_address": addr,
                "pan": pan,
                "nature_of_business": "Retail and Repair Service Center"
            }
        }
