# Database Setup Guide

## The Error You're Seeing

```
psycopg2.OperationalError: password authentication failed for user "postgres"
```

This means Alembic can't connect to PostgreSQL. Follow these steps to fix it:

---

## Step 1: Install PostgreSQL (if not installed)

### Windows

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Remember the password you set for the `postgres` user during installation
4. Default port is `5432` (keep this unless you have a reason to change it)

### Verify Installation

Open a new PowerShell window and test:

```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*

# If service exists but is stopped, start it:
Start-Service -Name "postgresql-x64-15"  # Adjust version number
```

---

## Step 2: Find Your PostgreSQL Password

The password you're trying to use is in the `.env` file. You need to know your actual PostgreSQL password.

**Option A: You know your postgres password**
- Update the `.env` file with the correct password

**Option B: You forgot your postgres password**
- You'll need to reset it (see instructions below)

**Option C: You don't have PostgreSQL installed**
- Install it using Step 1 above

---

## Step 3: Update Your .env File

Open `.env` and update the `DATABASE_URL` line with your actual PostgreSQL credentials:

```env
# Replace 'password' with your actual PostgreSQL password
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/milo_campaign
```

Example with password "mypass123":
```env
DATABASE_URL=postgresql://postgres:mypass123@localhost:5432/milo_campaign
```

---

## Step 4: Create the Database

### Option A: Using psql command line

```powershell
# Connect to PostgreSQL (will prompt for password)
psql -U postgres

# Once connected, run:
CREATE DATABASE milo_campaign;

# Exit psql
\q
```

### Option B: Using pgAdmin (GUI)

1. Open pgAdmin (installed with PostgreSQL)
2. Connect to your server
3. Right-click "Databases" → "Create" → "Database"
4. Name it: `milo_campaign`
5. Click "Save"

### Option C: Using Python Script

Save this as `create_db.py` in the project root:

```python
import psycopg2
from psycopg2 import sql

# Update these with your credentials
DB_USER = "postgres"
DB_PASSWORD = "your_password_here"  # Change this!
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "milo_campaign"

try:
    # Connect to PostgreSQL server
    conn = psycopg2.connect(
        dbname="postgres",  # Connect to default postgres database
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    conn.autocommit = True
    cursor = conn.cursor()

    # Create database
    cursor.execute(sql.SQL("CREATE DATABASE {}").format(
        sql.Identifier(DB_NAME)
    ))

    print(f"✅ Database '{DB_NAME}' created successfully!")

except psycopg2.errors.DuplicateDatabase:
    print(f"ℹ️  Database '{DB_NAME}' already exists")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    if conn:
        cursor.close()
        conn.close()
```

Run it:
```powershell
python create_db.py
```

---

## Step 5: Run Migrations

After the database is created and your `.env` is configured:

```powershell
# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

---

## Common Issues & Solutions

### Issue 1: "postgres user doesn't exist"

Create a postgres user:
```powershell
# In psql as superuser
CREATE USER postgres WITH PASSWORD 'your_password';
ALTER USER postgres WITH SUPERUSER;
```

### Issue 2: "PostgreSQL service not running"

Start the service:
```powershell
# Windows
Start-Service -Name "postgresql-x64-15"

# Or using pg_ctl (if PostgreSQL bin is in PATH)
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
```

### Issue 3: "Can't connect to localhost:5432"

PostgreSQL might be running on a different port:
```powershell
# Check what port PostgreSQL is using
netstat -an | findstr 5432

# If it's on a different port (e.g., 5433), update .env:
DATABASE_URL=postgresql://postgres:password@localhost:5433/milo_campaign
```

### Issue 4: "Role 'postgres' does not exist"

Your PostgreSQL might use a different superuser name. Check with:
```powershell
psql -U YourWindowsUsername -d postgres -c "\du"
```

---

## Quick Test Connection

Create a file `test_db.py`:

```python
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

try:
    # Try to connect
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    print("✅ Database connection successful!")
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("\nYour DATABASE_URL:", os.getenv('DATABASE_URL'))
```

Run:
```powershell
python test_db.py
```

---

## Still Having Issues?

1. **Check PostgreSQL is installed**: Look for PostgreSQL in your Start Menu
2. **Check the service is running**: Open Services and look for "postgresql"
3. **Verify your password**: Try connecting with pgAdmin or psql
4. **Check the port**: Make sure PostgreSQL is running on port 5432
5. **Use Docker instead**: See `docker-compose.yml` for a containerized setup

```powershell
# Use Docker (easier option)
docker-compose up -d db
# Then update .env:
DATABASE_URL=postgresql://milo_user:milo_password@localhost:5432/milo_campaign
```

---

## Next Steps

Once the database connection works:

1. Run migrations: `alembic upgrade head`
2. Start the API: `uvicorn app.main:app --reload`
3. Visit: http://localhost:8000/docs
