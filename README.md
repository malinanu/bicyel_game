# Milo Bicycle Campaign System

A promotional campaign system for Milo's 3M RTD pack sale with 1000 bicycle giveaway. Built with Python FastAPI, PostgreSQL, and Cloudflare R2 storage.

## Tech Stack

- **Backend Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0+
- **Authentication**: JWT with OTP verification
- **Storage**: Cloudflare R2 (S3-compatible)
- **SMS Gateway**: Text.lk API
- **Image Processing**: Pillow + ImageHash

## Features

- 📱 OTP-based phone authentication
- 🖼️ Image upload with duplicate detection (perceptual hashing)
- 🎯 Max 10 entries per user
- 🚴 Random winner selection (1000 bicycles)
- 📊 Admin statistics and management
- 🔒 JWT authentication
- ☁️ Cloudflare R2 storage integration
- 🔧 **Development mode** with mock services (no external dependencies)

## Development vs Production

### 🔧 Development Mode (Default)

For local development and testing, the application runs in **mock mode** by default:

- **Images**: Saved to `local_storage/` directory (no R2 needed)
- **OTP Codes**: Printed to console (no SMS API needed)
- **Zero external costs**: No cloud storage or SMS charges
- **Fast setup**: Start coding immediately without credentials

**Perfect for:**
- Local development
- Running tests
- CI/CD pipelines
- Demo/POC environments

### ☁️ Production Mode

When deployed to production with credentials configured:

- **Images**: Uploaded to Cloudflare R2 cloud storage
- **OTP Codes**: Sent via Text.lk SMS API
- **Full functionality**: Real-world behavior

**Switching modes:**
```env
# Development (default)
USE_MOCK_SERVICES=True
# Leave R2 and SMS credentials commented

# Production
USE_MOCK_SERVICES=False
R2_ACCOUNT_ID=your_account_id
TEXTLK_API_KEY=your_api_key
# ... configure all credentials
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide.

## Project Structure

```
milo-campaign/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   ├── otp.py
│   │   ├── entry.py
│   │   └── winner.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── entry.py
│   ├── services/            # Business logic
│   │   ├── otp_service.py
│   │   ├── image_service.py
│   │   └── auth_service.py
│   ├── routers/             # API routes
│   │   ├── auth.py
│   │   ├── entries.py
│   │   └── admin.py
│   └── utils/               # Utilities
│       ├── security.py
│       └── dependencies.py
├── alembic/                 # Database migrations
├── requirements.txt
├── .env.example
└── README.md
```

## Installation

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Virtual environment tool (venv/virtualenv)

### 2. Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd Nestla

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Unix/MacOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE milo_campaign;
CREATE USER milo_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE milo_campaign TO milo_user;
\q
```

### 4. Environment Configuration

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DATABASE_URL=postgresql://milo_user:secure_password@localhost:5432/milo_campaign

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-this

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=milo-campaign-images
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-public-domain.com

# Text.lk SMS API
TEXTLK_API_KEY=your_textlk_api_key
TEXTLK_SENDER_ID=Milo
```

### 5. Database Migration

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

## Running the Application

### Development Mode

```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
# Install gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000
```

## API Documentation

Once running, access interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication

- `POST /api/auth/request-otp` - Request OTP for login
- `POST /api/auth/verify-otp` - Verify OTP and get JWT token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

### Entries

- `POST /api/entries` - Submit new entry with image
- `GET /api/entries` - Get user's entries
- `POST /api/entries/check-duplicate` - Check if image is duplicate

### Admin

- `POST /api/admin/draw-winners` - Draw random winners
- `GET /api/admin/stats` - Get campaign statistics

## Usage Examples

### 1. Request OTP

```bash
curl -X POST "http://localhost:8000/api/auth/request-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone_number": "0771234567"
  }'
```

### 2. Verify OTP

```bash
curl -X POST "http://localhost:8000/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "0771234567",
    "otp_code": "123456"
  }'
```

### 3. Submit Entry

```bash
curl -X POST "http://localhost:8000/api/entries" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

### 4. Get User Entries

```bash
curl -X GET "http://localhost:8000/api/entries" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Configuration

Key configuration parameters in `.env`:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `MAX_ENTRIES_PER_USER` | Maximum entries per user | 10 |
| `OTP_EXPIRY_MINUTES` | OTP validity duration | 5 |
| `OTP_MAX_ATTEMPTS` | Maximum OTP verification attempts | 3 |
| `MAX_IMAGE_SIZE_MB` | Maximum image upload size | 5 |
| `TOTAL_BICYCLES` | Total bicycles to giveaway | 1000 |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token validity | 10080 (7 days) |

## Security Features

- 🔐 JWT authentication
- 📱 OTP verification via SMS
- 🖼️ Image duplicate detection using perceptual hashing
- 📏 Image size and type validation
- 🚫 Rate limiting on OTP attempts
- 🔒 Secure password hashing (bcrypt)

## Development

### Create New Migration

```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Rollback Migration

```bash
alembic downgrade -1
```

## Deployment Checklist

- [ ] Set strong `JWT_SECRET_KEY`
- [ ] Configure PostgreSQL with proper credentials
- [ ] Set up Cloudflare R2 bucket with CORS
- [ ] Get Text.lk API credentials
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure log rotation
- [ ] Set up automated backups
- [ ] Load test the API

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.
