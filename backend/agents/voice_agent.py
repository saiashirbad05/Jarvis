import re
from typing import Dict, Any

# Map of regional language keywords to standard appliance categories and translation helpers
REGIONAL_TRANSLATIONS = {
    "hindi": {
        "keywords": ["एसी", "एयर कंडीशनर", "फ्रिज", "रेफ्रिजरेटर", "कूलर", "वाशिंग मशीन", "टीवी", "टेलीविजन", "माइक्रोवेव"],
        "mapping": {
            "एसी": "Air Conditioner",
            "एयर कंडीशनर": "Air Conditioner",
            "फ्रिज": "Refrigerator",
            "रेफ्रिजरेटर": "Refrigerator",
            "कूलर": "Air Cooler",
            "वाशिंग मशीन": "Washing Machine",
            "टीवी": "Television",
            "टेलीविजन": "Television",
            "माइक्रोवेव": "Microwave"
        },
        "response_template": (
            "नमस्ते {name}! आपके द्वारा दी गई जानकारी के अनुसार:\n"
            "🔧 उपकरण: {appliance_type}\n"
            "💰 आपको मिला कोट: ₹{quoted_price}\n"
            "⚖️ हमारा निर्णय: {verdict_hindi}\n"
            "📊 बाजार की औसत दर: ₹{market_avg}\n\n"
            "💡 सलाह: {summary_hindi}"
        ),
        "verdicts": {
            "FAIR": "उचित मूल्य (FAIR)",
            "LOW": "कम मूल्य (LOW - बहुत अच्छा सौदा)",
            "HIGH": "अधिक मूल्य (HIGH - सावधान रहें)"
        }
    },
    "tamil": {
        "keywords": ["ஏசி", "பிரிட்ஜ்", "வாஷிங் மெஷின்", "டிவி", "மைக்ரோவேவ்"],
        "mapping": {
            "ஏசி": "Air Conditioner",
            "பிரிட்ஜ்": "Refrigerator",
            "வாஷிங் மெஷின்": "Washing Machine",
            "டிவி": "Television",
            "மைக்ரோவேவ்": "Microwave"
        },
        "response_template": (
            "வணக்கம் {name}! உங்கள் விவரங்களின் அடிப்படையில்:\n"
            "🔧 சாதனம்: {appliance_type}\n"
            "💰 உங்கள் கட்டணம்: ₹{quoted_price}\n"
            "⚖️ எங்கள் தீர்ப்பு: {verdict_tamil}\n"
            "📊 சந்தை சராசரி: ₹{market_avg}\n\n"
            "💡 பரிந்துரை: {summary_tamil}"
        ),
        "verdicts": {
            "FAIR": "நியாயமான விலை (FAIR)",
            "LOW": "குறைந்த விலை (LOW)",
            "HIGH": "அதிக விலை (HIGH - எச்சரிக்கை!)"
        }
    }
}

class VoiceBotAgent:
    """
    [BE-3] Dialogflow Multi-lingual Voice Bot Integration.
    Detects regional Indian languages (Hindi, Tamil, English fallback), performs entity extraction
    (converting regional terms like 'एसी' or 'பிரிட்ஜ்' into standard appliance entities, and numeric words to prices),
    and formats responses localized back in the matching tongue.
    """

    def parse_and_translate(self, text: str, sender_name: str = "ग्राहक") -> Dict[str, Any]:
        text_lower = text.lower()
        detected_lang = "english"
        
        # 1. Simple Language Detection
        # Checking for Devanagari characters for Hindi
        if re.search(r"[\u0900-\u097F]", text):
            detected_lang = "hindi"
        # Checking for Tamil characters
        elif re.search(r"[\u0B80-\u0BFF]", text):
            detected_lang = "tamil"
            
        # 2. Extract Quoted Price
        # Matches numbers like ₹3000, Rs 3000, 3000 रुपये, 3000 ரூபாய், etc.
        price = 1500.0
        price_match = re.search(r'(\d+)', text)
        if price_match:
            price = float(price_match.group(1))
            
        # 3. Map Appliance Type
        appliance_type = "Air Conditioner" # Default
        brand = "Multi-Brand"
        
        # Detect brand (Hindi/Tamil/English scripts supported)
        if "samsung" in text_lower or "सैमसंग" in text_lower or "சாம்சங்" in text_lower:
            brand = "Samsung"
        elif "lg" in text_lower or "एलजी" in text_lower or "எல்ஜி" in text_lower:
            brand = "LG"
        elif "whirlpool" in text_lower or "वर्लपूल" in text_lower:
            brand = "Whirlpool"
            
        # Resolve appliance translations
        if detected_lang in REGIONAL_TRANSLATIONS:
            lang_data = REGIONAL_TRANSLATIONS[detected_lang]
            for keyword, eng_val in lang_data["mapping"].items():
                if keyword in text:
                    appliance_type = eng_val
                    break
        else:
            # English standard heuristics
            if "fridge" in text_lower or "refrigerator" in text_lower:
                appliance_type = "Refrigerator"
            elif "washing" in text_lower or "machine" in text_lower:
                appliance_type = "Washing Machine"
            elif "tv" in text_lower or "television" in text_lower:
                appliance_type = "Television"
            elif "microwave" in text_lower:
                appliance_type = "Microwave"

        return {
            "detected_language": detected_lang,
            "appliance_type": appliance_type,
            "brand": brand,
            "quoted_price": price,
            "sender_name": sender_name
        }

    def generate_localized_reply(self, parsed_data: Dict[str, Any], evaluation_result: Dict[str, Any]) -> str:
        lang = parsed_data["detected_language"]
        verdict = evaluation_result.get("verdict", "FAIR").upper()
        market_avg = int(evaluation_result.get("details", {}).get("market", {}).get("average_market_price", 1500))
        summary = evaluation_result.get("summary", "")
        
        if lang == "hindi":
            lang_data = REGIONAL_TRANSLATIONS["hindi"]
            verdict_translated = lang_data["verdicts"].get(verdict, verdict)
            
            # Simple localized advice template
            summary_hindi = "यह कीमत बाजार दर के अनुकूल है। आप बेझिझक आगे बढ़ सकते हैं।"
            if verdict == "HIGH":
                summary_hindi = "सावधान! यह मरम्मत की दर बहुत अधिक है। कृपया हमारे बातचीत गाइड का उपयोग करें और मूल्य कम करवाएं।"
                
            return lang_data["response_template"].format(
                name=parsed_data["sender_name"],
                appliance_type=parsed_data["appliance_type"],
                quoted_price=int(parsed_data["quoted_price"]),
                verdict_hindi=verdict_translated,
                market_avg=market_avg,
                summary_hindi=summary_hindi
            )
            
        elif lang == "tamil":
            lang_data = REGIONAL_TRANSLATIONS["tamil"]
            verdict_translated = lang_data["verdicts"].get(verdict, verdict)
            
            summary_tamil = "இந்த விலை நியாயமானது. நீங்கள் தாராளமாக பழுது நீக்கலாம்."
            if verdict == "HIGH":
                summary_tamil = "எச்சரிக்கை! இந்த பழுது நீக்கும் விலை மிகவும் அதிகமாக உள்ளது. விலையை குறைக்க பேரம் பேசுங்கள்!"
                
            return lang_data["response_template"].format(
                name=parsed_data["sender_name"],
                appliance_type=parsed_data["appliance_type"],
                quoted_price=int(parsed_data["quoted_price"]),
                verdict_tamil=verdict_translated,
                market_avg=market_avg,
                summary_tamil=summary_tamil
            )
            
        else:
            # Fallback to English summary reply
            return (
                f"Hello {parsed_data['sender_name']}! For your {parsed_data['appliance_type']} quote of ₹{int(parsed_data['quoted_price'])}: "
                f"Our AI analysis verdict is {verdict}. The regional market average is ₹{market_avg}. "
                f"Diagnostic Advice: {summary}"
            )
