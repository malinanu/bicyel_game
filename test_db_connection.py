"""
Test database connection script
Run this to verify your DATABASE_URL is correct
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

def test_connection():
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("❌ DATABASE_URL not found in .env file")
        print("   Please copy .env.example to .env and configure it")
        return False

    print("=" * 60)
    print("Testing Database Connection")
    print("=" * 60)
    print()
    print(f"📋 DATABASE_URL: {database_url.replace(database_url.split(':')[2].split('@')[0], '****')}")
    print()

    try:
        print("🔌 Attempting to connect...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()

        # Get PostgreSQL version
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]

        print("✅ Connection successful!")
        print()
        print(f"📊 PostgreSQL Version:")
        print(f"   {version.split(',')[0]}")
        print()

        # Test if we can query
        cursor.execute("SELECT current_database(), current_user;")
        db, user = cursor.fetchone()

        print(f"📦 Database: {db}")
        print(f"👤 User: {user}")
        print()

        # Check if tables exist
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()

        if tables:
            print(f"📋 Existing tables ({len(tables)}):")
            for table in tables:
                print(f"   - {table[0]}")
        else:
            print("ℹ️  No tables found yet")
            print("   Run migrations to create tables:")
            print("   1. alembic revision --autogenerate -m 'Initial migration'")
            print("   2. alembic upgrade head")

        cursor.close()
        conn.close()
        print()
        print("✅ All checks passed! Database is ready.")
        return True

    except psycopg2.OperationalError as e:
        print("❌ Connection failed!")
        print()
        print(f"Error: {e}")
        print()
        print("Common issues:")
        print("  1. PostgreSQL is not running")
        print("  2. Wrong password in DATABASE_URL")
        print("  3. Database doesn't exist yet")
        print("  4. Wrong host or port")
        print()
        print("Solutions:")
        print("  ✓ Check PostgreSQL service: Get-Service postgresql*")
        print("  ✓ Verify credentials in .env file")
        print("  ✓ Create database: python create_db.py")
        print("  ✓ See SETUP_DATABASE.md for detailed help")
        return False

    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        print()
        print(f"Your DATABASE_URL: {database_url}")
        return False

if __name__ == "__main__":
    success = test_connection()
    if not success:
        exit(1)
