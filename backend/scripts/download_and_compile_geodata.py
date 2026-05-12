import os
import csv
import json
import urllib.request
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
import sys

# Ensure backend root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

load_dotenv()

CSV_URL = "https://raw.githubusercontent.com/dropdevrahul/pincodes-india/refs/heads/main/pincode.csv"
JSON_CACHE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "db", "pincodes_cache.json"))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Ommsai05@127.0.0.1:5432/postgres")

def download_and_compile():
    print(f"Downloading Indian pincode CSV from: {CSV_URL}")
    try:
        req = urllib.request.Request(
            CSV_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=60) as response:
            content = response.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error downloading CSV: {e}")
        return False

    print("CSV downloaded successfully! Parsing and grouping by pincode...")
    pincode_groups = {}
    
    # Parse CSV content using built-in csv reader
    lines = content.splitlines()
    reader = csv.DictReader(lines)
    
    total_rows = 0
    for row in reader:
        try:
            pincode = row.get("Pincode", "").strip()
            locality = row.get("OfficeName", "").strip()
            city = row.get("District", "").strip()
            state = row.get("StateName", "").strip()
            
            if not (pincode and locality and city and state):
                continue
            
            total_rows += 1
            if pincode not in pincode_groups:
                pincode_groups[pincode] = {
                    "state": state.upper(),
                    "city": city.title(),
                    "localities": []
                }
            
            if locality not in pincode_groups[pincode]["localities"]:
                pincode_groups[pincode]["localities"].append(locality)
        except Exception as row_err:
            print(f"Skipping row due to error: {row_err}")
            continue

    print(f"Processed {total_rows} rows from CSV.")
    print(f"Grouped into {len(pincode_groups)} unique Indian pincodes!")

    # Write compiled JSON cache
    print(f"Saving compiled JSON cache to {JSON_CACHE_PATH}...")
    os.makedirs(os.path.dirname(JSON_CACHE_PATH), exist_ok=True)
    with open(JSON_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(pincode_groups, f, ensure_ascii=False, indent=2)
    print("Compiled local JSON cache saved successfully!")

    # Now attempt to seed the PostgreSQL database if online
    print("Attempting to connect to PostgreSQL to seed geo_locations table...")
    try:
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=3)
        conn.autocommit = False
        cursor = conn.cursor()
        
        print("Database connected! Preparing database seed records...")
        
        # Format records for INSERT
        db_records = []
        for pincode, group in pincode_groups.items():
            state = group["state"]
            city = group["city"]
            for locality in group["localities"]:
                db_records.append((pincode, locality, city, state))
                
        print(f"Formed {len(db_records)} records to seed into PostgreSQL database. Clearing existing geo_locations table...")
        cursor.execute("TRUNCATE TABLE geo_locations RESTART IDENTITY;")
        
        print("Inserting records in fast bulk chunks...")
        insert_query = "INSERT INTO geo_locations (pincode, locality, city, state) VALUES %s"
        chunk_size = 5000
        total_inserted = 0
        
        for i in range(0, len(db_records), chunk_size):
            chunk = db_records[i:i+chunk_size]
            execute_values(cursor, insert_query, chunk)
            total_inserted += len(chunk)
            print(f"Inserted {total_inserted}/{len(db_records)} rows into PostgreSQL...")
            
        conn.commit()
        print("PostgreSQL database successfully seeded with dropdevrahul dataset!")
        cursor.close()
        conn.close()
    except Exception as db_err:
        print(f"\n[PostgreSQL Seed Offline/Skipped] Could not seed database: {db_err}")
        print("No worries! The local compiled JSON cache is active and will be used as the offline database fallback!")
        
    return True

if __name__ == "__main__":
    download_and_compile()
