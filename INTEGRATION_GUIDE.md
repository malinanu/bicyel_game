# Frontend-Backend Integration Guide

This guide explains how to run both the backend (FastAPI) and the Loveble frontend (Vite React) together.

## Project Structure

```
Nestla/
├── app/                          # FastAPI backend
│   ├── main.py
│   ├── routers/
│   └── ...
├── frontend/                     # Vite React frontend (Loveble)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── ...
```

## Prerequisites

- Python 3.8+ with pip
- Node.js 18+ with npm
- PostgreSQL database (configured in `.env`)

## Backend Setup (FastAPI)

### 1. Install Dependencies

```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # On Windows
# source .venv/bin/activate  # On Linux/Mac

# Install requirements
pip install -r requirements.txt
```

### 2. Configure Environment

Make sure your `.env` file is configured:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nestla_db

# API Settings
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# Services
USE_MOCK_SERVICES=True  # Use mock services for development

# Other settings...
```

### 3. Run Database Migrations

```bash
# Initialize database
alembic upgrade head

# Or create tables directly (if not using alembic)
python create_db.py
```

### 4. Start Backend Server

```bash
# Option 1: Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Option 2: Using Python
python -m app.main
```

Backend will be available at: **http://localhost:8000**
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## Frontend Setup (Loveble/Vite)

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

The `.env` file has been created for you:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Start Frontend Development Server

```bash
npm run dev
```

Frontend will be available at: **http://localhost:8080**

## Running Both Together

### Terminal 1 - Backend
```bash
# From project root
.venv\Scripts\activate
uvicorn app.main:app --reload
```

### Terminal 2 - Frontend
```bash
# From project root
cd frontend
npm run dev
```

## API Integration

The frontend has been integrated with your backend API. The following endpoints are connected:

### Authentication (`/api/auth`)
- ✅ **POST** `/request-otp` - Request OTP for phone number
- ✅ **POST** `/verify-otp` - Verify OTP and login
- ✅ **GET** `/me` - Get current user info
- ✅ **POST** `/logout` - Logout user

### Entries (`/api/entries`)
- ✅ **POST** `/validate-code` - Validate unique Milo pack code
- ✅ **POST** `/` - Create entry with image upload
- ✅ **GET** `/` - Get user's entries
- ✅ **POST** `/check-duplicate` - Check for duplicate images

## Frontend Architecture

### API Service Layer
- **Location**: `frontend/src/services/api.ts`
- **Config**: `frontend/src/config/api.ts`

The `apiClient` singleton handles all API communication:

```typescript
import { apiClient } from '@/services/api';

// Example: Login flow
await apiClient.requestOtp({ phone_number: '0712345678' });
await apiClient.verifyOtp({ phone_number: '0712345678', otp_code: '123456' });

// Example: Submit entry
await apiClient.validateCode({ code: 'MILO2024' });
await apiClient.createEntry(imageFile, codeId);
```

### Components Updated
- ✅ `LoginPage.tsx` - Real OTP authentication
- ✅ `CodeEntryPage.tsx` - Real code validation
- ✅ `CameraCapturePage.tsx` - Real image upload with fraud detection

## Testing the Integration

### 1. Test Authentication Flow

1. Go to http://localhost:8080
2. Click "Login" or "Get Started"
3. Enter phone number (development mode will log OTP to console)
4. Check backend terminal for OTP code
5. Enter OTP to login

### 2. Test Entry Submission Flow

1. After logging in, click "Submit Entry"
2. Enter a valid code (codes must exist in database)
3. Take/upload a photo
4. Submit the entry
5. Check for fraud detection feedback

### 3. Add Test Codes to Database

```python
# Run in Python console or create a script
from app.database import SessionLocal
from app.models.code import Code

db = SessionLocal()

# Add test codes
test_codes = ['MILO2024', 'WIN1000', 'CGQSQC', 'ENERGY1', 'CHAMP25']
for code in test_codes:
    db_code = Code(code=code, used=False)
    db.add(db_code)

db.commit()
db.close()
```

## CORS Configuration

The backend is configured to accept requests from the frontend:

```python
# In app/main.py
allow_origins=[
    "http://localhost:3000",  # Next.js
    "http://localhost:8000",  # Backend
    "http://localhost:8080",  # Vite frontend (Loveble)
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8080",
]
```

## Development Mode Features

When `USE_MOCK_SERVICES=True` in backend `.env`:

- 📧 **OTP**: Printed to console instead of SMS
- 🖼️ **Images**: Stored locally in `local_storage/` directory
- 🔍 **Access local images**: http://localhost:8000/local-images/

## Production Deployment

### Environment Variables to Update

**Backend (.env):**
```env
DEBUG=False
USE_MOCK_SERVICES=False
CLOUDFLARE_R2_ENDPOINT=your-r2-endpoint
CLOUDFLARE_R2_ACCESS_KEY_ID=your-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret
TEXT_LK_API_KEY=your-textlk-key
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=https://your-api-domain.com
```

### Build Frontend for Production

```bash
cd frontend
npm run build
```

Built files will be in `frontend/dist/`

## Troubleshooting

### Backend not starting
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Check port 8000 is not in use

### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check console for CORS errors
- Verify `VITE_API_BASE_URL` in `.env`

### Image upload fails
- Check `local_storage/` directory exists
- Verify file permissions
- Check backend console for errors

### Code validation fails
- Ensure codes exist in database
- Check codes table: `SELECT * FROM codes;`
- Verify code hasn't been used

## Support

For issues or questions:
1. Check backend logs in terminal
2. Check browser console for frontend errors
3. Review API documentation at http://localhost:8000/docs
