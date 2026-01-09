# Quick Start Guide

Get the Milo Campaign API up and running in 5 minutes - **no external services needed!**

## Prerequisites

- Python 3.11+
- PostgreSQL 15+

**That's it!** No R2 or SMS credentials needed for development.

## Quick Setup

### 1. Install Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Unix/MacOS:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example env file
copy .env.example .env   # Windows
# or
cp .env.example .env     # Unix/MacOS
```

Edit `.env` and set **only these required values**:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/milo_campaign
JWT_SECRET_KEY=any-random-string-for-dev
```

**Note**: Leave R2 and SMS credentials commented out. The app will automatically use:
- **Local storage** for images (saved to `local_storage/`)
- **Console output** for OTP codes (no SMS sent)

### 3. Setup Database

```bash
# Create database
createdb milo_campaign

# Or using psql:
psql -U postgres -c "CREATE DATABASE milo_campaign;"

# Run migrations
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### 4. Run the Application

```bash
uvicorn app.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Test the API

### 1. Request OTP

```bash
curl -X POST http://localhost:8000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","phone_number":"0771234567"}'
```

**Check your terminal!** The OTP code will be printed like this:
```
============================================================
🔧 DEV MODE: OTP Code Generated
============================================================
Phone: 94771234567
OTP Code: 123456
Expires in: 5 minutes
============================================================
```

### 2. Verify OTP

Use the OTP code from your terminal:

```bash
curl -X POST http://localhost:8000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"0771234567","otp_code":"123456"}'
```

Save the `access_token` from the response!

### 3. Get User Info

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Upload Entry

```bash
curl -X POST http://localhost:8000/api/entries \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@path/to/image.jpg"
```

**Images are saved locally** to `local_storage/entries/{user_id}/` and accessible at:
`http://localhost:8000/local-images/entries/{user_id}/{filename}.jpg`

## Common Issues

### Database Connection Error

Make sure PostgreSQL is running:

```bash
# Check status
pg_ctl status

# Start PostgreSQL
pg_ctl start
```

### Module Not Found Error

Ensure virtual environment is activated and dependencies are installed:

```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Port Already in Use

Change the port in command:

```bash
uvicorn app.main:app --reload --port 8001
```

## Production Setup

When you're ready to deploy to production:

### 1. Configure External Services

Edit `.env` and uncomment the service credentials:

```env
# Disable mock services
USE_MOCK_SERVICES=False

# Configure R2
R2_ACCOUNT_ID=your_actual_account_id
R2_ACCESS_KEY_ID=your_actual_access_key
R2_SECRET_ACCESS_KEY=your_actual_secret_key
R2_BUCKET_NAME=milo-campaign-images
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-public-domain.com

# Configure SMS
TEXTLK_API_KEY=your_actual_api_key
```

### 2. Verify Production Mode

Start the API and check the startup logs show:
```
☁️ Production Mode:
  - Images: Cloudflare R2
  - OTP: Text.lk SMS
```

### 3. Test Real Services

- OTP codes will be sent via SMS (not console)
- Images will be uploaded to R2 (not local storage)

## Next Steps

- Review [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide
- Review [README.md](README.md) for full documentation
- Set up reverse proxy (Nginx)
- Enable SSL/TLS
- Set up monitoring

## Need Help?

- **Development Guide**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **API Documentation**: http://localhost:8000/docs
- **Database Setup**: [SETUP_DATABASE.md](SETUP_DATABASE.md)
