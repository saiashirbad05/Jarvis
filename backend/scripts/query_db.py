import psycopg2

DATABASE_URL = "postgresql://postgres:Ommsai05@127.0.0.1:5432/postgres"

def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    tables = ['users', 'search_history', 'custom_searches', 'community_reports', 'quote_checks']
    
    for table in tables:
        print(f"--- COLUMNS FOR {table.upper()} ---")
        cur.execute(f"""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = '{table}'
            ORDER BY ordinal_position;
        """)
        for row in cur.fetchall():
            print(f"  {row[0]} ({row[1]}) - Nullable: {row[2]}")
        print()
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
