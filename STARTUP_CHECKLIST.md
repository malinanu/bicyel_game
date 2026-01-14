# Startup Checklist

Before running the application, verify these items:

## Backend Prerequisites

### 1. Environment Variables (.env)
```bash
# Check your .env file has these required variables:
DATABASE_URL=postgresql://user:password@localhost:5432/nestla_db
JWT_SECRET_KEY=your-secret-key-here
USE_MOCK_SERVICES=True  # For development
API_HOST=0.0.0.0
API_PORT=8000
```

### 2. Database Setup
```bash
# Make sure PostgreSQL is running and database exists
psql -U postgres -c "CREATE DATABASE nestla_db;"

# Run migrations
alembic upgrade head

# OR create tables directly
python create_db.py
```

### 3. Add Test Codes
Your database needs codes for testing. Run this Python script:

```python
# add_test_codes.py
from app.database import SessionLocal
from app.models.code import Code

db = SessionLocal()

test_codes = ['MILO2024', 'WIN1000', 'CGQSQC', 'ENERGY1', 'CHAMP25']
for code_str in test_codes:
    existing = db.query(Code).filter(Code.code == code_str).first()
    if not existing:
        code = Code(code=code_str, used=False)
        db.add(code)
        print(f"Added: {code_str}")
    else:
        print(f"Already exists: {code_str}")

db.commit()
db.close()
print("Done!")
```

Save as `add_test_codes.py` and run:
```bash
python add_test_codes.py
```

## Frontend Prerequisites

### 1. Check .env file exists
```bash
# In frontend/.env
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Install dependencies
```bash
cd frontend
npm install
```

## Start the Application

### Terminal 1 - Backend
```bash
# From project root
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
Milo Campaign API Starting
Environment: development
Debug Mode: True
Mock Services: ENABLED

Development Mode:
  - Images: Local storage (local_storage/)
  - OTP: Console output (check terminal)

API Documentation: http://localhost:8000/docs
```

### Terminal 2 - Frontend
```bash
# From project root
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.4.19  ready in XXX ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

## Verify Integration

### 1. Test Backend API
Open: http://localhost:8000/docs

Try the health endpoint:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status":"healthy"}
```

### 2. Test Frontend Load
Open: http://localhost:8080

You should see the Milo campaign landing page.

### 3. Test Full Flow

1. **Click "Get Started"** or **"Login"**
2. **Enter phone number**: `0712345678`
3. **Check backend terminal** - you should see OTP printed:
   ```
   📱 OTP for 0712345678: 123456
   ```
4. **Enter the OTP code** from terminal
5. **Click "Submit Entry"**
6. **Enter test code**: `MILO2024` or any from the list
7. **Upload/capture image**
8. **Submit**

## Common Issues

### ❌ Backend won't start
- **Check**: PostgreSQL is running
- **Check**: Database exists and credentials in .env are correct
- **Check**: Port 8000 is not already in use
  ```bash
  # Windows
  netstat -ano | findstr :8000
  # Linux/Mac
  lsof -i :8000
  ```

### ❌ Frontend won't start
- **Check**: Port 8080 is available
- **Check**: node_modules installed (`npm install`)
- **Check**: .env file exists in frontend/

### ❌ Frontend can't connect to backend
- **Check**: Backend is running (visit http://localhost:8000/health)
- **Check**: CORS is configured (should already be done)
- **Check**: Browser console for errors (F12)

### ❌ "Invalid code" error
- **Check**: Codes exist in database
  ```sql
  SELECT * FROM codes WHERE used = false;
  ```
- **Check**: Code hasn't been used already

### ❌ OTP not working
- **Check**: Backend terminal shows OTP being sent
- **Check**: USE_MOCK_SERVICES=True in backend .env
- In development mode, OTP is printed to console, not sent via SMS

### ❌ Image upload fails
- **Check**: `local_storage/` directory exists in project root
- **Check**: File permissions allow writing to that directory
- **Check**: Backend console for detailed error messages

## Success Indicators

✅ Backend shows startup banner with service configuration
✅ Frontend loads at http://localhost:8080
✅ Can see API docs at http://localhost:8000/docs
✅ OTP appears in backend terminal
✅ Can login and see dashboard
✅ Can validate codes
✅ Can upload images

## Need Help?

1. Check both terminal outputs for error messages
2. Check browser console (F12 → Console tab)
3. Visit API docs to test endpoints directly: http://localhost:8000/docs
4. Review `INTEGRATION_GUIDE.md` for detailed setup info
