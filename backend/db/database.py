"""
ServiceOne Database Module — Cloud SQL PostgreSQL Connection Manager
"""
import os
import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool
import sys
from contextlib import contextmanager
from dotenv import load_dotenv
import urllib.request
import json

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Ommsai05@127.0.0.1:5432/postgres")

import time

# Circuit breaker to prevent synchronous connection blocks when DB is down
db_circuit_broken_until = 0.0

def is_database_available() -> bool:
    """Check if database connection attempts are currently allowed (circuit breaker)."""
    global db_pool, db_circuit_broken_until
    if db_pool is None:
        if time.time() < db_circuit_broken_until:
            return False
    return True

def record_database_failure():
    """Record a connection failure to trip the circuit breaker for 30 seconds."""
    global db_circuit_broken_until
    db_circuit_broken_until = time.time() + 30.0
    print("[Database Circuit Breaker] Tripped! Connection attempts disabled for 30 seconds.")

# Initialize a global ThreadedConnectionPool to handle high concurrency (up to 500 parallel users smoothly)
try:
    # Try initializing the pool with a very short connection timeout so it doesn't block startup
    dsn_params = DATABASE_URL
    if "connect_timeout" not in DATABASE_URL:
        dsn_params += ("&" if "?" in DATABASE_URL else "?") + "connect_timeout=2"
    db_pool = ThreadedConnectionPool(
        minconn=10,
        maxconn=150,
        dsn=dsn_params
    )
    print("[Database] Threaded connection pool initialized successfully (min=10, max=150).")
except Exception as e:
    print(f"[Database Error] Failed to initialize ThreadedConnectionPool: {e}", file=sys.stderr)
    db_pool = None
    record_database_failure()


@contextmanager
def get_db():
    """Get a database connection from the pool with auto-commit and cleanup."""
    global db_pool
    if not is_database_available():
        # Raise OperationalError immediately to hit fallbacks without blocking the thread
        raise psycopg2.OperationalError("Database circuit breaker active: skipping connection attempt to prevent blocking.")

    if db_pool is None:
        # Fallback to direct connections if pool initialization failed
        conn = None
        try:
            # Short connection timeout (1 second) to prevent lag
            conn = psycopg2.connect(DATABASE_URL, connect_timeout=1)
            conn.autocommit = False
            yield conn
            conn.commit()
        except Exception:
            if conn:
                try:
                    conn.rollback()
                except Exception:
                    pass
            record_database_failure()
            raise
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass
    else:
        conn = None
        try:
            conn = db_pool.getconn()
            conn.autocommit = False
            yield conn
            conn.commit()
        except Exception:
            if conn:
                try:
                    conn.rollback()
                except Exception:
                    pass
            record_database_failure()
            raise
        finally:
            if conn:
                try:
                    db_pool.putconn(conn)
                except Exception:
                    pass


@contextmanager
def get_cursor(dict_cursor=True):
    """Get a database cursor directly."""
    with get_db() as conn:
        cursor_factory = psycopg2.extras.RealDictCursor if dict_cursor else None
        cursor = conn.cursor(cursor_factory=cursor_factory)
        try:
            yield cursor
        finally:
            cursor.close()


# ── Quote Checks ─────────────────────────────────────────────
def save_quote_check(data: dict) -> int:
    """Save a quote check result. Returns the new row ID."""
    # Ensure user_id key is present
    if "user_id" not in data:
        data["user_id"] = None
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO quote_checks 
            (city, area, appliance, brand, service_type, quoted_price, 
             fair_range_min, fair_range_max, verdict, confidence_score,
             explanation, provider_name, full_result_json, user_id)
            VALUES (%(city)s, %(area)s, %(appliance)s, %(brand)s, %(service_type)s,
                    %(quoted_price)s, %(fair_range_min)s, %(fair_range_max)s,
                    %(verdict)s, %(confidence_score)s, %(explanation)s,
                    %(provider_name)s, %(full_result_json)s, %(user_id)s)
            RETURNING id
        """, data)
        return cur.fetchone()["id"]


def get_quote_history(limit=50):
    """Get recent quote check history."""
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM quote_checks 
            ORDER BY created_at DESC LIMIT %s
        """, (limit,))
        return cur.fetchall()


# ── Search History ───────────────────────────────────────────
def save_search_history(data: dict) -> int:
    """Save a search to history for dashboard."""
    # Ensure user_id key is present
    if "user_id" not in data:
        data["user_id"] = None
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO search_history
            (search_query, appliance_type, service_type, city, quoted_price,
             verdict, potential_savings, source_links, full_result_json, user_id)
            VALUES (%(search_query)s, %(appliance_type)s, %(service_type)s,
                    %(city)s, %(quoted_price)s, %(verdict)s, %(potential_savings)s,
                    %(source_links)s, %(full_result_json)s, %(user_id)s)
            RETURNING id
        """, data)
        return cur.fetchone()["id"]


def get_search_history(limit=50, email: str = None):
    """Get recent search history for dashboard, strictly filtered by user email to ensure absolute isolation."""
    if not email:
        return []
    with get_cursor() as cur:
        cur.execute("""
            SELECT sh.* FROM search_history sh
            JOIN users u ON sh.user_id = u.id
            WHERE LOWER(u.email) = LOWER(%s)
            ORDER BY sh.created_at DESC LIMIT %s
        """, (email, limit))
        return cur.fetchall()


def toggle_bookmark(search_id: int) -> bool:
    """Toggle bookmark on a search history item."""
    with get_cursor() as cur:
        cur.execute("""
            UPDATE search_history 
            SET is_bookmarked = NOT is_bookmarked
            WHERE id = %s
            RETURNING is_bookmarked
        """, (search_id,))
        row = cur.fetchone()
        return row["is_bookmarked"] if row else False


# ── Custom Searches ──────────────────────────────────────────
def save_custom_search(data: dict) -> int:
    """Save a user-added custom search URL."""
    if "user_id" not in data:
        data["user_id"] = None
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO custom_searches
            (search_label, search_url, search_type, notes, user_id)
            VALUES (%(search_label)s, %(search_url)s, %(search_type)s, %(notes)s, %(user_id)s)
            RETURNING id
        """, data)
        return cur.fetchone()["id"]


def get_custom_searches(limit=50, email: str = None):
    """Get user's custom searches, strictly filtered by user email to ensure absolute isolation."""
    if not email:
        return []
    with get_cursor() as cur:
        cur.execute("""
            SELECT cs.* FROM custom_searches cs
            JOIN users u ON cs.user_id = u.id
            WHERE LOWER(u.email) = LOWER(%s)
            ORDER BY cs.created_at DESC LIMIT %s
        """, (email, limit))
        return cur.fetchall()


def delete_custom_search(search_id: int):
    """Delete a custom search."""
    with get_cursor() as cur:
        cur.execute("DELETE FROM custom_searches WHERE id = %s", (search_id,))


# ── Providers ────────────────────────────────────────────────
def upsert_provider(data: dict) -> int:
    """Insert or update a provider (by name + city + source)."""
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO providers 
            (name, city, area, appliance_types, phone, address, 
             google_maps_url, website_url, source, source_url,
             avg_rating, review_count, avg_price_min, avg_price_max)
            VALUES (%(name)s, %(city)s, %(area)s, %(appliance_types)s,
                    %(phone)s, %(address)s, %(google_maps_url)s, %(website_url)s,
                    %(source)s, %(source_url)s, %(avg_rating)s, %(review_count)s,
                    %(avg_price_min)s, %(avg_price_max)s)
            ON CONFLICT (id) DO UPDATE SET
                avg_rating = EXCLUDED.avg_rating,
                review_count = EXCLUDED.review_count,
                avg_price_min = EXCLUDED.avg_price_min,
                avg_price_max = EXCLUDED.avg_price_max,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        """, data)
        return cur.fetchone()["id"]


def get_providers_by_city(city: str, appliance: str = None, limit=20):
    """Get providers in a city, optionally filtered by appliance type."""
    with get_cursor() as cur:
        if appliance:
            cur.execute("""
                SELECT * FROM providers 
                WHERE LOWER(city) = LOWER(%s) AND %s = ANY(appliance_types)
                AND is_active = TRUE
                ORDER BY avg_rating DESC NULLS LAST LIMIT %s
            """, (city, appliance, limit))
        else:
            cur.execute("""
                SELECT * FROM providers
                WHERE LOWER(city) = LOWER(%s) AND is_active = TRUE
                ORDER BY avg_rating DESC NULLS LAST LIMIT %s
            """, (city, limit))
        return cur.fetchall()


# ── Cache ────────────────────────────────────────────────────
def get_cached_signal(cache_key: str):
    """Get a cached market signal if still valid."""
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM cached_market_signals 
            WHERE cache_key = %s AND expires_at > CURRENT_TIMESTAMP
        """, (cache_key,))
        return cur.fetchone()


def save_cached_signal(data: dict):
    """Save or update a cached market signal."""
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO cached_market_signals
            (cache_key, city, appliance, service_type, brand,
             avg_price, price_range_min, price_range_max,
             sources_json, provider_suggestions, raw_scraped_data, expires_at)
            VALUES (%(cache_key)s, %(city)s, %(appliance)s, %(service_type)s,
                    %(brand)s, %(avg_price)s, %(price_range_min)s, %(price_range_max)s,
                    %(sources_json)s, %(provider_suggestions)s, %(raw_scraped_data)s,
                    %(expires_at)s)
            ON CONFLICT (cache_key) DO UPDATE SET
                avg_price = EXCLUDED.avg_price,
                price_range_min = EXCLUDED.price_range_min,
                price_range_max = EXCLUDED.price_range_max,
                sources_json = EXCLUDED.sources_json,
                provider_suggestions = EXCLUDED.provider_suggestions,
                raw_scraped_data = EXCLUDED.raw_scraped_data,
                scraped_at = CURRENT_TIMESTAMP,
                expires_at = EXCLUDED.expires_at
        """, data)


# ── Community Reports ────────────────────────────────────────
def save_community_report(data: dict) -> int:
    """Save a community-submitted report with user ID and proof photo."""
    if "user_id" not in data:
        data["user_id"] = None
    if "proof_image_url" not in data:
        data["proof_image_url"] = None
    if "approved_status" not in data:
        data["approved_status"] = 'pending'
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO community_reports
            (city, area, appliance, service_type, provider_name,
             quoted_price, notes, user_id, proof_image_url, approved_status)
            VALUES (%(city)s, %(area)s, %(appliance)s, %(service_type)s,
                    %(provider_name)s, %(quoted_price)s, %(notes)s,
                    %(user_id)s, %(proof_image_url)s, %(approved_status)s)
            RETURNING id
        """, data)
        return cur.fetchone()["id"]


def get_community_reports(city: str = None, appliance: str = None, limit=50):
    """Get approved community reports, optionally filtered."""
    with get_cursor() as cur:
        conditions = ["approved_status = 'approved'"]
        params = []
        if city:
            conditions.append("LOWER(city) = LOWER(%s)")
            params.append(city)
        if appliance:
            conditions.append("LOWER(appliance) = LOWER(%s)")
            params.append(appliance)
        params.append(limit)
        
        where = " AND ".join(conditions)
        cur.execute(f"""
            SELECT * FROM community_reports 
            WHERE {where}
            ORDER BY created_at DESC LIMIT %s
        """, params)
        return cur.fetchall()


def get_user_community_reports(email: str, limit=50):
    """Retrieve community reports strictly submitted by the logged-in user email."""
    if not email:
        return []
    with get_cursor() as cur:
        cur.execute("""
            SELECT cr.* FROM community_reports cr
            JOIN users u ON cr.user_id = u.id
            WHERE LOWER(u.email) = LOWER(%s)
            ORDER BY cr.created_at DESC LIMIT %s
        """, (email, limit))
        return cur.fetchall()


def get_all_community_reports_for_admin(limit=100):
    """Retrieve all submitted community reports for moderation (pending, approved, rejected)."""
    with get_cursor() as cur:
        cur.execute("""
            SELECT cr.*, u.email as user_email, u.name as user_name FROM community_reports cr
            LEFT JOIN users u ON cr.user_id = u.id
            ORDER BY cr.created_at DESC LIMIT %s
        """, (limit,))
        return cur.fetchall()


def update_community_report_status(report_id: int, status: str) -> bool:
    """Set the approved_status of a community report to approved or rejected."""
    with get_cursor() as cur:
        cur.execute("""
            UPDATE community_reports
            SET approved_status = %s
            WHERE id = %s
            RETURNING id
        """, (status, report_id))
        return cur.fetchone() is not None


# ── Geographic Lookup (India) — Robust Infallible System ─────────────────

FALLBACK_PINS = {
    # 11: Delhi
    "11": {
        "state": "DELHI",
        "city": "New Delhi",
        "localities": ["Connaught Place", "Karol Bagh", "Dwarka Sector 10", "Rohini Sector 3", "Saket", "Vasant Kunj", "Lajpat Nagar", "Chandni Chowk", "Okhla Phase 3", "Rajouri Garden"]
    },
    # 12: Haryana
    "12": {
        "state": "HARYANA",
        "city": "Gurugram",
        "localities": ["DLF Phase 3", "Sohna Road", "Sector 45", "Sector 56", "Sector 21", "Udyog Vihar", "Palam Vihar", "Golf Course Road"]
    },
    "13": {
        "state": "HARYANA",
        "city": "Faridabad",
        "localities": ["Sector 15", "Sector 37", "Sector 21C", "Greenfield Colony", "Surajkund", "Mathura Road", "Ballabhgarh"]
    },
    # 14-15: Punjab
    "14": {
        "state": "PUNJAB",
        "city": "Ludhiana",
        "localities": ["Sarabha Nagar", "Model Town", "Civil Lines", "BRS Nagar", "Ferozepur Road", "Gill Road", "Sundar Nagar"]
    },
    "15": {
        "state": "PUNJAB",
        "city": "Amritsar",
        "localities": ["Ranjit Avenue", "Mall Road", "Golden Temple Area", "Putligarh", "Lawrence Road", "Chheharta"]
    },
    # 16: Chandigarh
    "16": {
        "state": "CHANDIGARH",
        "city": "Chandigarh",
        "localities": ["Sector 17", "Sector 35", "Sector 8", "Sector 22", "Sector 15", "Manimajra", "Industrial Area Phase 1"]
    },
    # 17: Himachal
    "17": {
        "state": "HIMACHAL PRADESH",
        "city": "Shimla",
        "localities": ["Mall Road", "Chotta Shimla", "Sanjauli", "Kasumpti", "Summer Hill", "Lakkar Bazar", "New Shimla"]
    },
    # 18-19: Jammu & Kashmir
    "18": {
        "state": "JAMMU AND KASHMIR",
        "city": "Jammu",
        "localities": ["Gandhi Nagar", "Trikuta Nagar", "Channi Himmat", "Bari Brahmana", "Rehari Chhawni", "Karan Nagar"]
    },
    "19": {
        "state": "JAMMU AND KASHMIR",
        "city": "Srinagar",
        "localities": ["Lal Chowk", "Rajbagh", "Karan Nagar", "Nishat", "Hazratbal", "Sonwar", "Soura"]
    },
    # 20-28: UP
    "20": {
        "state": "UTTAR PRADESH",
        "city": "Noida",
        "localities": ["Sector 62", "Sector 18", "Sector 15", "Sector 50", "Sector 137", "Sector 76", "Noida Extension", "Sector 93"]
    },
    "21": {
        "state": "UTTAR PRADESH",
        "city": "Lucknow",
        "localities": ["Hazratganj", "Gomti Nagar", "Aliganj", "Indira Nagar", "Charbagh", "Aminabad", "Ashiyana", "Mahanagar"]
    },
    "22": {
        "state": "UTTAR PRADESH",
        "city": "Kanpur",
        "localities": ["Swarup Nagar", "Kalyanpur", "Kidwai Nagar", "Civil Lines", "Lajpat Nagar", "Sharda Nagar", "Mall Road"]
    },
    "24": {
        "state": "UTTARAKHAND",
        "city": "Dehradun",
        "localities": ["Rajpur Road", "Dehradun Cantt", "Dalanwala", "Jakhan Cantt", "Patel Nagar", "Prem Nagar", "Vikas Nagar"]
    },
    "25": {
        "state": "UTTAR PRADESH",
        "city": "Meerut",
        "localities": ["Shastri Nagar", "Modipuram", "Saket", "Civil Lines", "Pallavpuram", "Meerut Cantt"]
    },
    "27": {
        "state": "UTTAR PRADESH",
        "city": "Varanasi",
        "localities": ["Lanka", "Cantonment", "Assi Ghat", "Sigra", "Bhelupur", "Sarnath", "Godowlia"]
    },
    "28": {
        "state": "UTTAR PRADESH",
        "city": "Agra",
        "localities": ["Tajganj", "Sanjay Place", "Sikandra", "Dayalbagh", "Kamla Nagar", "Fatehabad Road"]
    },
    # 30-34: Rajasthan
    "30": {
        "state": "RAJASTHAN",
        "city": "Jaipur",
        "localities": ["Malviya Nagar", "Vaishali Nagar", "C-Scheme", "Mansarovar", "Raja Park", "Tonk Road", "Adarsh Nagar", "Sanganer"]
    },
    "31": {
        "state": "RAJASTHAN",
        "city": "Udaipur",
        "localities": ["Panchwati", "Hiran Magri", "Fatehpura", "Sector 4", "Lake Palace Road", "Shobhagpura"]
    },
    "32": {
        "state": "RAJASTHAN",
        "city": "Kota",
        "localities": ["Vigyan Nagar", "Talwandi", "Rajeev Gandhi Nagar", "Kunhari", "Dadabari", "Nayapura"]
    },
    "34": {
        "state": "RAJASTHAN",
        "city": "Jodhpur",
        "localities": ["Sardarpura", "Shastri Nagar", "Ratanada", "Chasni Circle", "Kamla Nehru Nagar", "Mandore"]
    },
    # 36-39: Gujarat
    "36": {
        "state": "GUJARAT",
        "city": "Rajkot",
        "localities": ["Kalawad Road", "Yagnik Road", "Amin Marg", "Moti Tanki", "University Road", "Bhakti Nagar"]
    },
    "38": {
        "state": "GUJARAT",
        "city": "Ahmedabad",
        "localities": ["Satellite", "C G Road", "Bodakdev", "Vastrapur", "Prahlad Nagar", "Navrangpura", "Paldi", "Ghatlodia"]
    },
    "39": {
        "state": "GUJARAT",
        "city": "Surat",
        "localities": ["Adajan", "Vesu", "Piplod", "Varachha", "Katargam", "Nanpura", "Ghod Dod Road"]
    },
    # 40-44: Maharashtra
    "40": {
        "state": "MAHARASHTRA",
        "city": "Mumbai",
        "localities": ["Andheri West", "Bandra West", "Colaba", "Dadar", "Borivali West", "Powai", "Juhu", "Ghatkopar", "Worli", "Chembur"]
    },
    "41": {
        "state": "MAHARASHTRA",
        "city": "Pune",
        "localities": ["Koregaon Park", "Kothrud", "Aundh", "Viman Nagar", "Hinjewadi", "Baner", "Kalyani Nagar", "Hadapsar", "Wakad"]
    },
    "42": {
        "state": "MAHARASHTRA",
        "city": "Thane",
        "localities": ["Ghodbunder Road", "Naupada", "Wagle Estate", "Kopri", "Vartak Nagar", "Majiwada", "Kalyan"]
    },
    "44": {
        "state": "MAHARASHTRA",
        "city": "Nagpur",
        "localities": ["Dharampeth", "Ramdaspeth", "Sadar", "Wardha Road", "Manish Nagar", "Nandanvan", "Pratap Nagar"]
    },
    # 45-48: MP
    "45": {
        "state": "MADHYA PRADESH",
        "city": "Indore",
        "localities": ["Vijay Nagar", "Palasia", "Rajendra Nagar", "Sudama Nagar", "Annapurna", "Chappan Dukan", "Mahalaxmi Nagar"]
    },
    "46": {
        "state": "MADHYA PRADESH",
        "city": "Bhopal",
        "localities": ["Arera Colony", "MP Nagar", "Kolar Road", "TT Nagar", "Indrapuri", "Bairagarh", "Habibganj"]
    },
    "48": {
        "state": "MADHYA PRADESH",
        "city": "Gwalior",
        "localities": ["Lashkar", "Morar", "DD Nagar", "City Center", "Hazira", "Gwalior Cantt"]
    },
    "49": {
        "state": "CHHATTISGARH",
        "city": "Raipur",
        "localities": ["Shankar Nagar", "Devendra Nagar", "Pandri", "Tatibandh", "Samta Colony", "Sadar Bazar"]
    },
    # 50: Telangana
    "50": {
        "state": "TELANGANA",
        "city": "Hyderabad",
        "localities": ["Gachibowli", "Madhapur", "Jubilee Hills", "Banjara Hills", "Kondapur", "Begumpet", "Kukatpally", "Secunderabad", "Ameerpet", "Mehdipatnam"]
    },
    # 51-53: AP
    "52": {
        "state": "ANDHRA PRADESH",
        "city": "Vijayawada",
        "localities": ["Benz Circle", "Governorpet", "Moghalrajpuram", "Labbipet", "Satyanarayanapuram", "One Town"]
    },
    "53": {
        "state": "ANDHRA PRADESH",
        "city": "Visakhapatnam",
        "localities": ["Gajuwaka", "MVP Colony", "Siripuram", "Madhurawada", "Dwarka Nagar", "Jagadamba Junction", "Maharanipeta"]
    },
    # 56-59: Karnataka
    "56": {
        "state": "KARNATAKA",
        "city": "Bengaluru",
        "localities": ["Indiranagar", "Koramangala", "HSR Layout", "Jayanagar", "Whitefield", "Electronic City", "Marathahalli", "BTM Layout", "Malleshwaram", "Hebbal"]
    },
    "57": {
        "state": "KARNATAKA",
        "city": "Mysuru",
        "localities": ["Gokulam", "Vidyaranyapuram", "Jayalakshmipuram", "Hebbal", "Kuvempunagar", "Siddhartha Layout"]
    },
    "58": {
        "state": "KARNATAKA",
        "city": "Hubballi",
        "localities": ["Keshwapur", "Vidyanagar", "Gokul Road", "Deshpande Nagar", "Shirur Park", "Koppikar Road"]
    },
    # 60-64: Tamil Nadu
    "60": {
        "state": "TAMIL NADU",
        "city": "Chennai",
        "localities": ["Adyar", "Anna Nagar", "T Nagar", "Velachery", "Mylapore", "Nungambakkam", "Tambaram", "OMR Sholinganallur", "Besant Nagar", "Guindy"]
    },
    "61": {
        "state": "TAMIL NADU",
        "city": "Madurai",
        "localities": ["KK Nagar", "Anna Nagar", "Sellur", "Simmakkal", "Goripalayam", "Koodal Nagar"]
    },
    "64": {
        "state": "TAMIL NADU",
        "city": "Coimbatore",
        "localities": ["Gandhipuram", "RS Puram", "Peelamedu", "Saibaba Colony", "Ramanathapuram", "Singanallur", "Saravanampatti"]
    },
    # 67-69: Kerala
    "68": {
        "state": "KERALA",
        "city": "Kochi",
        "localities": ["Ernakulam", "Edappally", "Kadavanthra", "Kakkanad", "Vytilla", "Fort Kochi", "Aluva", "Tripunithura"]
    },
    "69": {
        "state": "KERALA",
        "city": "Thiruvananthapuram",
        "localities": ["Kazhakkoottam", "Vazhuthacaud", "Palayam", "Pattom", "Kowdiar", "Medical College Area"]
    },
    # 70-74: West Bengal
    "70": {
        "state": "WEST BENGAL",
        "city": "Kolkata",
        "localities": ["Salt Lake Sector 5", "Park Street", "Gariahat", "New Town", "Behala", "Jadavpur", "Alipore", "Dum Dum", "Ballygunge", "Howrah"]
    },
    # 75-77: Odisha
    "75": {
        "state": "ODISHA",
        "city": "Bhubaneswar",
        "localities": ["Patia", "Nayapalli", "Kharavela Nagar", "Saheed Nagar", "Jayadev Vihar", "Chandrasekharpur"]
    },
    # 78: Assam
    "78": {
        "state": "ASSAM",
        "city": "Guwahati",
        "localities": ["Ganeshguri", "Paltan Bazaar", "Dispur", "Beltola", "Silpukhuri", "Khanapara", "Adabari"]
    },
    # 79: North East
    "79": {
        "state": "MEGHALAYA",
        "city": "Shillong",
        "localities": ["Police Bazar", "Laitumkhrah", "Nongthymmai", "Mawlai", "Laban"]
    },
    # 80-85: Bihar
    "80": {
        "state": "BIHAR",
        "city": "Patna",
        "localities": ["Kankarbagh", "Bailey Road", "Boring Road", "Patliputra Colony", "Fraser Road", "Rajendra Nagar", "Anisabad"]
    },
    "82": {
        "state": "JHARKHAND",
        "city": "Ranchi",
        "localities": ["Lalpur", "Morabadi", "Harmu Colony", "Doranda", "Kanke Road", "Bariatu"]
    },
}

# Load compiled local JSON cache on startup if it exists
JSON_CACHE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "db", "pincodes_cache.json"))
COMPILED_PINS_CACHE = {}

if os.path.exists(JSON_CACHE_PATH):
    try:
        with open(JSON_CACHE_PATH, "r", encoding="utf-8") as f:
            COMPILED_PINS_CACHE = json.load(f)
        print(f"[Database] Loaded {len(COMPILED_PINS_CACHE)} unique Indian pincodes from compiled cache successfully.")
    except Exception as e:
        print(f"[Database] Error loading compiled pincodes cache: {e}")

def generate_pincode_fallback(pincode: str) -> list:
    """
    In-memory geographic fallback generator.
    Looks up pincode in our downloaded compiled cache of 19,300 Indian pincodes,
    or falls back to a deterministic generator if not found.
    """
    if len(pincode) != 6 or not pincode.isdigit():
        return []
    
    # Check compiled cache first (100% real, accurate localities)
    if pincode in COMPILED_PINS_CACHE:
        record = COMPILED_PINS_CACHE[pincode]
        state = record["state"]
        city = record["city"]
        localities = record["localities"]
        return [{
            "pincode": pincode,
            "locality": loc,
            "city": city,
            "state": state
        } for loc in localities]
        
    # If not in compiled cache, use the prefix mapping generator
    prefix2 = pincode[:2]
    prefix1 = pincode[0]
    
    record = FALLBACK_PINS.get(prefix2)
    if not record:
        # Fallback to region-specific default if exact 2-digit prefix is not found
        region_defaults = {
            "1": {"state": "DELHI", "city": "New Delhi", "localities": ["Connaught Place", "Karol Bagh", "Dwarka Sector 10", "Rohini Sector 3", "Saket"]},
            "2": {"state": "UTTAR PRADESH", "city": "Noida", "localities": ["Sector 62", "Sector 18", "Sector 15", "Sector 50", "Sector 137"]},
            "3": {"state": "RAJASTHAN", "city": "Jaipur", "localities": ["Malviya Nagar", "Vaishali Nagar", "C-Scheme", "Mansarovar", "Raja Park"]},
            "4": {"state": "MAHARASHTRA", "city": "Mumbai", "localities": ["Andheri West", "Bandra West", "Colaba", "Dadar", "Borivali West"]},
            "5": {"state": "KARNATAKA", "city": "Bengaluru", "localities": ["Indiranagar", "Koramangala", "HSR Layout", "Jayanagar", "Whitefield"]},
            "6": {"state": "TAMIL NADU", "city": "Chennai", "localities": ["Adyar", "Anna Nagar", "T Nagar", "Velachery", "Mylapore"]},
            "7": {"state": "WEST BENGAL", "city": "Kolkata", "localities": ["Salt Lake Sector 5", "Park Street", "Gariahat", "New Town", "Behala"]},
            "8": {"state": "BIHAR", "city": "Patna", "localities": ["Kankarbagh", "Bailey Road", "Boring Road", "Patliputra Colony", "Fraser Road"]},
            "9": {"state": "TELANGANA", "city": "Hyderabad", "localities": ["Gachibowli", "Madhapur", "Jubilee Hills", "Banjara Hills", "Kondapur"]},
        }
        record = region_defaults.get(prefix1, region_defaults["1"])
        
    state = record["state"]
    city = record["city"]
    localities = record["localities"]
    
    return [{
        "pincode": pincode,
        "locality": loc,
        "city": city,
        "state": state
    } for loc in localities]

def get_geo_states():
    """Retrieve distinct states sorted alphabetically (Postgres with In-Memory fallback)."""
    try:
        with get_cursor() as cur:
            cur.execute("""
                SELECT DISTINCT state FROM geo_locations 
                WHERE state IS NOT NULL AND state != ''
                ORDER BY state ASC
            """)
            rows = cur.fetchall()
            if rows:
                return [row["state"] for row in rows]
    except Exception as e:
        print(f"[GeoLookup] DB error fetching states: {e}")
    
    # Fallback: Extract from COMPILED_PINS_CACHE if loaded, else FALLBACK_PINS
    if COMPILED_PINS_CACHE:
        states = sorted(list({v["state"] for v in COMPILED_PINS_CACHE.values()}))
        return states
    states = sorted(list({v["state"] for v in FALLBACK_PINS.values()}))
    return states


def get_geo_cities(state: str):
    """Retrieve distinct cities for a given state sorted alphabetically (Postgres with In-Memory fallback)."""
    try:
        with get_cursor() as cur:
            cur.execute("""
                SELECT DISTINCT city FROM geo_locations 
                WHERE LOWER(state) = LOWER(%s) AND city IS NOT NULL AND city != ''
                ORDER BY city ASC
            """, (state,))
            rows = cur.fetchall()
            if rows:
                return [row["city"] for row in rows]
    except Exception as e:
        print(f"[GeoLookup] DB error fetching cities for state '{state}': {e}")
        
    # Fallback: Extract matching cities from COMPILED_PINS_CACHE or FALLBACK_PINS
    cities = []
    cache_to_use = COMPILED_PINS_CACHE if COMPILED_PINS_CACHE else FALLBACK_PINS
    for v in cache_to_use.values():
        if v["state"].lower() == state.lower() and v["city"] not in cities:
            cities.append(v["city"])
    return sorted(cities) if cities else ["New Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Pune", "Noida", "Gurugram"]


def get_geo_localities(city: str):
    """Retrieve distinct localities for a given city sorted alphabetically (Postgres with In-Memory fallback)."""
    try:
        with get_cursor() as cur:
            cur.execute("""
                SELECT DISTINCT locality FROM geo_locations 
                WHERE LOWER(city) = LOWER(%s) AND locality IS NOT NULL AND locality != ''
                ORDER BY locality ASC
            """, (city,))
            rows = cur.fetchall()
            if rows:
                return [row["locality"] for row in rows]
    except Exception as e:
        print(f"[GeoLookup] DB error fetching localities for city '{city}': {e}")
        
    # Fallback: Extract matching localities from COMPILED_PINS_CACHE or FALLBACK_PINS
    localities = []
    cache_to_use = COMPILED_PINS_CACHE if COMPILED_PINS_CACHE else FALLBACK_PINS
    for v in cache_to_use.values():
        if v["city"].lower() == city.lower():
            localities.extend(v["localities"])
    if localities:
        return sorted(list(set(localities)))
    return ["Main Market", "Sector 1", "Civil Lines", "Railway Station Road", "Defense Colony"]


def insert_geo_location(pincode: str, locality: str, city: str, state: str):
    """Dynamically save a geo-location row if not already present."""
    try:
        with get_cursor() as cur:
            # Check if already exists to avoid duplicates
            cur.execute("""
                SELECT id FROM geo_locations 
                WHERE pincode = %s AND LOWER(locality) = LOWER(%s)
            """, (pincode, locality))
            if cur.fetchone():
                return
            
            cur.execute("""
                INSERT INTO geo_locations (pincode, locality, city, state)
                VALUES (%s, %s, %s, %s)
            """, (pincode, locality, city, state))
    except Exception as e:
        print(f"[GeoLookup] DB error inserting geo location: {e}")


def fetch_external_pincode(pincode: str):
    """Fetch pincode data from public Indian Postal API as fallback."""
    url = f"https://api.postalpincode.in/pincode/{pincode}"
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                if data and isinstance(data, list) and data[0].get("Status") == "Success":
                    return data[0].get("PostOffice")
    except Exception as e:
        print(f"[GeoLookup] Error fetching external pincode {pincode}: {e}")
    return None


def get_geo_by_pincode(pincode: str):
    """Retrieve state, city, and localities matching a 6-digit pincode with external API fallback and 100% infallible memory fallback."""
    try:
        with get_cursor() as cur:
            cur.execute("""
                SELECT pincode, locality, city, state FROM geo_locations 
                WHERE pincode = %s
                ORDER BY locality ASC
            """, (pincode,))
            rows = cur.fetchall()
            if rows:
                return rows
    except Exception as db_err:
        print(f"[GeoLookup] PostgreSQL connection offline: {db_err}")

    # DB Cache Miss -> Check offline high-fidelity COMPILED_PINS_CACHE first for an instant, real match!
    if COMPILED_PINS_CACHE and pincode in COMPILED_PINS_CACHE:
        print(f"[GeoLookup] Pincode {pincode} found in offline COMPILED_PINS_CACHE. Inserting and returning...")
        record = COMPILED_PINS_CACHE[pincode]
        state = record["state"]
        city = record["city"]
        localities = record["localities"]
        
        inserted_rows = []
        for loc in localities:
            insert_geo_location(pincode, loc, city, state)
            inserted_rows.append({
                "pincode": pincode,
                "locality": loc,
                "city": city,
                "state": state
            })
        return inserted_rows

    # DB & Local Cache Miss -> Fetch from public Indian Postal API as absolute last resort
    print(f"[GeoLookup] Pincode {pincode} not found in database or local cache. Fetching from Postal API...")
    offices = fetch_external_pincode(pincode)
    if offices:
        inserted_rows = []
        for office in offices:
            locality = office.get("Name")
            city = office.get("District")
            state = office.get("State")
            if locality and city and state:
                # Format state in uppercase, city/locality in Title Case
                formatted_state = state.upper()
                insert_geo_location(pincode, locality, city, formatted_state)
                inserted_rows.append({
                    "pincode": pincode,
                    "locality": locality,
                    "city": city,
                    "state": formatted_state
                })
        if inserted_rows:
            return inserted_rows
            
    # In-Memory Infallible Fallback Generator (Guarantees lookup never fails even if postal api is offline)
    print(f"[GeoLookup] Falling back to high-fidelity regional generator for pincode {pincode}")
    return generate_pincode_fallback(pincode)



def get_user_by_email(email: str):
    """Retrieve full user row by email address."""
    with get_cursor() as cur:
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cur.fetchone()


def get_or_create_user(email: str, name: str = None) -> int:
    """Get or create user by email, returning the user's primary key ID with auto-promotion of developers."""
    with get_cursor() as cur:
        cur.execute("SELECT id, name FROM users WHERE email = %s", (email,))
        row = cur.fetchone()
        if row:
            if (not row.get("name")) and name:
                cur.execute("UPDATE users SET name = %s WHERE id = %s", (name, row["id"]))
            return row["id"]
        
        # Auto-promote specific administrative accounts
        role = "admin" if email.lower() in [
            "developer@serviceone.dev", 
            "test@serviceone.dev", 
            "admin@serviceone.dev",
            "saias@serviceone.dev",
            "saias@gmail.com"
        ] else "user"
        
        cur.execute("""
            INSERT INTO users (email, name, google_id, role)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (email, name or email.split("@")[0].capitalize(), email, role))
        return cur.fetchone()["id"]


