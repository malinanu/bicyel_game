# Development Guide

This guide explains how to develop and test the Milo Campaign API locally without external service dependencies.

## Development vs Production Modes

The API supports two modes:

### 🔧 Development Mode (Default)
- **Images**: Saved to `local_storage/` directory
- **OTP Codes**: Printed to console (no SMS sent)
- **No external service costs**
- **Fast and easy testing**

### ☁️ Production Mode
- **Images**: Uploaded to Cloudflare R2
- **OTP Codes**: Sent via Text.lk SMS
- **Requires credentials**
- **Real-world behavior**

## Quick Start (Development)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Configure only the database (leave R2 and SMS commented)
# Edit .env:
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/milo_campaign

# 3. Run migrations
alembic upgrade head

# 4. Start the API
uvicorn app.main:app --reload
```

That's it! No R2 or SMS credentials needed.

## Development Mode Features

### Mock Image Service

**What it does:**
- Saves images to `local_storage/entries/{user_id}/`
- Serves images via `http://localhost:8000/local-images/...`
- Performs same validation, optimization, and duplicate detection as production

**Where images are stored:**
```
local_storage/
└── entries/
    ├── 1/
    │   ├── abc123.jpg
    │   └── def456.jpg
    └── 2/
        └── ghi789.jpg
```

**Accessing images:**
```bash
# Images are accessible at:
http://localhost:8000/local-images/entries/{user_id}/{filename}.jpg
```

**Example console output:**
```
🔧 DEV MODE: Image saved locally
   Path: local_storage/entries/1/abc123-def456.jpg
   URL: http://localhost:8000/local-images/entries/1/abc123-def456.jpg
   Size: 245,678 bytes
```

### Mock OTP Service

**What it does:**
- Generates and stores OTP in database (same as production)
- **Prints OTP code to terminal** instead of sending SMS
- All verification logic works identically to production

**Example console output when requesting OTP:**
```
============================================================
🔧 DEV MODE: OTP Code Generated
============================================================
Phone: 94771234567
OTP Code: 123456
Expires in: 5 minutes
============================================================
Copy this OTP to verify in the app
============================================================
```

**How to use:**
1. Call `POST /api/auth/request-otp` with your phone number
2. Look at the console/terminal where the API is running
3. Copy the OTP code from the console output
4. Use that code to call `POST /api/auth/verify-otp`

## Testing the API

### 1. Test OTP Flow

```bash
# Request OTP
curl -X POST http://localhost:8000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone_number":"0771234567"}'

# Check console for OTP code, then verify:
curl -X POST http://localhost:8000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"0771234567","otp_code":"123456"}'

# Save the access_token from response
```

### 2. Test Image Upload

```bash
# Upload an image
curl -X POST http://localhost:8000/api/entries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@path/to/test-image.jpg"

# Check local_storage/entries/{user_id}/ for the saved image
# Access the image in browser:
# http://localhost:8000/local-images/entries/{user_id}/{filename}.jpg
```

### 3. Test Duplicate Detection

```bash
# Try uploading the same image twice
# Second upload should fail with "duplicate" message

# Or check before uploading:
curl -X POST http://localhost:8000/api/entries/check-duplicate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@path/to/test-image.jpg"
```

### 4. Get User Entries

```bash
curl -X GET http://localhost:8000/api/entries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Configuration Options

### .env Configuration

```env
# Development Mode (default)
USE_MOCK_SERVICES=True
# R2_ACCOUNT_ID=... (leave commented)
# TEXTLK_API_KEY=... (leave commented)

# Production Mode
USE_MOCK_SERVICES=False
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
# ... (all R2 credentials)
TEXTLK_API_KEY=your_textlk_key
```

### Auto Mode Detection

The API automatically enables mock services if credentials are missing:

- **No R2 credentials** → Uses local storage
- **No SMS API key** → Prints OTP to console
- **USE_MOCK_SERVICES=True** → Forces mock mode even with credentials

## Startup Logs

When you start the API, you'll see:

**Development Mode:**
```
============================================================
Milo Campaign API Starting
============================================================
Environment: development
Debug Mode: True
Mock Services: ENABLED

🔧 Development Mode:
  - Images: Local storage (local_storage/)
    Access at: http://localhost:8000/local-images/
  - OTP: Console output (check terminal)
============================================================
API Documentation: http://localhost:8000/docs
============================================================
```

**Production Mode:**
```
============================================================
Milo Campaign API Starting
============================================================
Environment: production
Debug Mode: False
Mock Services: DISABLED

☁️ Production Mode:
  - Images: Cloudflare R2
  - OTP: Text.lk SMS
============================================================
API Documentation: http://localhost:8000/docs
============================================================
```

## Switching to Production

To switch from development to production:

1. **Configure R2 credentials** in `.env`:
   ```env
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=milo-campaign-images
   R2_ENDPOINT_URL=https://account_id.r2.cloudflarestorage.com
   R2_PUBLIC_URL=https://your-domain.com
   ```

2. **Configure SMS API key** in `.env`:
   ```env
   TEXTLK_API_KEY=your_api_key
   ```

3. **Disable mock services**:
   ```env
   USE_MOCK_SERVICES=False
   ```

4. **Restart the API**:
   ```bash
   uvicorn app.main:app --reload
   ```

5. **Verify startup logs** show "☁️ Production Mode"

## Debugging Tips

### Check Service Mode

```bash
# Visit this endpoint to see current configuration:
curl http://localhost:8000/api/admin/stats
```

### View Console Logs

OTP codes and image operations are logged to console with emoji prefixes:
- 🔧 = Development/Mock service activity
- ☁️ = Production service activity
- ❌ = Errors
- ✅ = Success messages

### Inspect Local Storage

```bash
# List all stored images
ls -R local_storage/

# View specific user's images
ls local_storage/entries/1/

# Check image in browser
# http://localhost:8000/local-images/entries/1/filename.jpg
```

### Test with API Documentation

Visit `http://localhost:8000/docs` for interactive API testing with Swagger UI.

## Common Development Tasks

### Reset Local Data

```bash
# Clear all local images
rm -rf local_storage/

# Reset database
alembic downgrade base
alembic upgrade head
```

### Test Image Duplicate Detection

```bash
# 1. Upload an image
curl -X POST http://localhost:8000/api/entries \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@test.jpg"

# 2. Try uploading the same image again
# Should get: "This image has already been uploaded"

# 3. Modify the image slightly and try again
# Perceptual hash should still detect it as duplicate
```

### Simulate Production Behavior

```bash
# Temporarily enable production mode without credentials
USE_MOCK_SERVICES=False uvicorn app.main:app --reload

# This will show errors when trying to use R2/SMS
# Useful for testing error handling
```

## Database Management

### View OTP Records

```sql
-- Connect to database
psql -d milo_campaign

-- View recent OTPs
SELECT phone_number, otp_code, verified, created_at
FROM otp_verifications
ORDER BY created_at DESC
LIMIT 10;

-- View all users
SELECT id, name, phone_number, phone_verified_at
FROM users;

-- View entries with image info
SELECT e.id, e.user_id, e.image_hash, e.verified, e.created_at
FROM entries e
JOIN users u ON e.user_id = u.id;
```

## Next Steps

- Review [README.md](README.md) for full documentation
- Check [QUICKSTART.md](QUICKSTART.md) for quick setup
- See [SETUP_DATABASE.md](SETUP_DATABASE.md) for database troubleshooting

## Need Help?

- OTP not showing in console? Check that `USE_MOCK_SERVICES=True`
- Images not accessible? Verify `/local-images` is mounted (check startup logs)
- Can't connect to database? See [SETUP_DATABASE.md](SETUP_DATABASE.md)
