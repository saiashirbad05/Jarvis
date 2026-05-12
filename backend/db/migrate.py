"""Run the schema.sql against Cloud SQL PostgreSQL."""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Ommsai05@localhost:5432/postgres")

def run_schema():
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r") as f:
        schema_sql = f.read()
    
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute(schema_sql)
    cursor.close()
    conn.close()
    print("Schema migration complete!")

if __name__ == "__main__":
    run_schema()
