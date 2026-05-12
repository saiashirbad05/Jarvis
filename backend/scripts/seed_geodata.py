import os
import requests
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Ommsai05@localhost:5432/postgres")
DATA_URL = "https://raw.githubusercontent.com/mithunsasidharan/India-Pincode-Lookup/master/pincodes.json"

def seed_geography():
    print("Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cursor = conn.cursor()
    
    print("Clearing existing geo_locations table...")
    cursor.execute("TRUNCATE TABLE geo_locations RESTART IDENTITY;")
    
    print(f"Downloading Indian pincode data from {DATA_URL}...")
    try:
        response = requests.get(DATA_URL, timeout=30)
        response.raise_for_status()
        pincodes_data = response.json()
    except Exception as e:
        print(f"Error downloading data: {e}")
        cursor.close()
        conn.close()
        return

    total_records = len(pincodes_data)
    print(f"Downloaded {total_records} records! Preparing to insert...")

    # Parse and filter unique combinations to prevent duplicates if any, and map fields
    unique_records = {}
    for item in pincodes_data:
        pincode = str(item.get("pincode", "")).strip()
        locality = str(item.get("officeName", "")).strip()
        city = str(item.get("districtName", "")).strip()
        state = str(item.get("stateName", "")).strip()
        
        if not (pincode and locality and city and state):
            continue
            
        key = (pincode, locality, city, state)
        unique_records[key] = True

    records_to_insert = list(unique_records.keys())
    print(f"Deduped to {len(records_to_insert)} unique records. Running chunked bulk insert...")

    chunk_size = 5000
    total_inserted = 0
    
    # Bulk insert query using execute_values for maximum performance in PostgreSQL
    insert_query = "INSERT INTO geo_locations (pincode, locality, city, state) VALUES %s"

    try:
        for i in range(0, len(records_to_insert), chunk_size):
            chunk = records_to_insert[i:i + chunk_size]
            execute_values(cursor, insert_query, chunk)
            total_inserted += len(chunk)
            print(f"Inserted {total_inserted}/{len(records_to_insert)} rows...")
        
        conn.commit()
        print("Geographic database seeding successful and committed!")
    except Exception as err:
        conn.rollback()
        print(f"Failed to insert geographic data: {err}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    seed_geography()
