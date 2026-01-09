"""
Database creation script for Milo Campaign
Run this to create the PostgreSQL database
"""
import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_database():
    # Parse DATABASE_URL from .env
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("❌ DATABASE_URL not found in .env file")
        return False

    # Parse the database URL
    # Format: postgresql://user:password@host:port/dbname
    try:
        parts = database_url.replace('postgresql://', '').split('@')
        user_pass = parts[0].split(':')
        host_port_db = parts[1].split('/')
        host_port = host_port_db[0].split(':')

        DB_USER = user_pass[0]
        DB_PASSWORD = user_pass[1] if len(user_pass) > 1 else ''
        DB_HOST = host_port[0]
        DB_PORT = host_port[1] if len(host_port) > 1 else '5432'
        DB_NAME = host_port_db[1].split('?')[0]  # Remove query params if any

        print(f"📋 Connection Details:")
        print(f"   User: {DB_USER}")
        print(f"   Host: {DB_HOST}")
        print(f"   Port: {DB_PORT}")
        print(f"   Database to create: {DB_NAME}")
        print()

    except Exception as e:
        print(f"❌ Error parsing DATABASE_URL: {e}")
        print(f"   DATABASE_URL format should be: postgresql://user:password@host:port/dbname")
        return False

    conn = None
    try:
        # Connect to PostgreSQL server (default postgres database)
        print(f"🔌 Connecting to PostgreSQL server...")
        conn = psycopg2.connect(
            dbname="postgres",  # Connect to default postgres database
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        print(f"✅ Connected to PostgreSQL server successfully!")
        print()

        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (DB_NAME,)
        )
        exists = cursor.fetchone()

        if exists:
            print(f"ℹ️  Database '{DB_NAME}' already exists")
            return True

        # Create database
        print(f"📦 Creating database '{DB_NAME}'...")
        cursor.execute(sql.SQL("CREATE DATABASE {}").format(
            sql.Identifier(DB_NAME)
        ))

        print(f"✅ Database '{DB_NAME}' created successfully!")
        print()
        print("Next steps:")
        print("  1. Run migrations: alembic revision --autogenerate -m 'Initial migration'")
        print("  2. Apply migrations: alembic upgrade head")
        print("  3. Start the API: uvicorn app.main:app --reload")

        return True

    except psycopg2.OperationalError as e:
        print(f"❌ Connection Error: {e}")
        print()
        print("Common issues:")
        print("  1. PostgreSQL is not running")
        print("  2. Wrong password in .env file")
        print("  3. PostgreSQL is running on a different port")
        print("  4. User doesn't have permission to create databases")
        print()
        print("Solutions:")
        print("  - Check PostgreSQL service is running: Get-Service postgresql*")
        print("  - Verify password in .env matches your PostgreSQL password")
        print("  - Try connecting with psql or pgAdmin first")
        return False

    except psycopg2.errors.DuplicateDatabase:
        print(f"ℹ️  Database '{DB_NAME}' already exists")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

    finally:
        if conn:
            cursor.close()
            conn.close()
            print("🔌 Connection closed")

if __name__ == "__main__":
    print("=" * 60)
    print("Milo Campaign - Database Setup")
    print("=" * 60)
    print()

    success = create_database()

    if not success:
        print()
        print("💡 Need help? Check SETUP_DATABASE.md for detailed instructions")
        exit(1)
