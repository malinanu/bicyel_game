"""
Mock Image Service for Development
Saves images to local filesystem instead of Cloudflare R2
"""
import os
import logging
from PIL import Image
from imagehash import phash
from io import BytesIO
from typing import Tuple
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.entry import Entry
from app.config import settings
import uuid

logger = logging.getLogger(__name__)

class MockImageService:
    """Mock image service that uses local filesystem instead of R2"""

    def __init__(self, db: Session):
        self.db = db
        self.storage_dir = "local_storage"
        # Create base storage directory
        os.makedirs(self.storage_dir, exist_ok=True)
        logger.info(f"🔧 MockImageService initialized - storing to {self.storage_dir}/")

    def calculate_image_hash(self, image_data: bytes) -> str:
        """Calculate perceptual hash of image"""
        image = Image.open(BytesIO(image_data))
        return str(phash(image))

    def optimize_image(self, image_data: bytes) -> Tuple[bytes, int]:
        """Optimize and resize image"""
        image = Image.open(BytesIO(image_data))

        # Convert to RGB if needed
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background

        # Resize maintaining aspect ratio
        image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)

        # Save optimized image
        output = BytesIO()
        image.save(output, format='JPEG', quality=85, optimize=True)
        optimized_data = output.getvalue()

        return optimized_data, len(optimized_data)

    def is_duplicate(self, image_hash: str) -> bool:
        """Check if image hash exists"""
        return self.db.query(Entry).filter(
            Entry.image_hash == image_hash
        ).first() is not None

    async def upload_image(
        self,
        file: UploadFile,
        user_id: int
    ) -> dict:
        """Upload and process image - saves to local storage"""
        try:
            # Read file data
            image_data = await file.read()

            # Check file size
            size_mb = len(image_data) / (1024 * 1024)
            if size_mb > settings.MAX_IMAGE_SIZE_MB:
                return {
                    "success": False,
                    "message": f"Image size exceeds {settings.MAX_IMAGE_SIZE_MB}MB limit"
                }

            # Validate image type
            if file.content_type not in ['image/jpeg', 'image/jpg', 'image/png']:
                return {
                    "success": False,
                    "message": "Only JPEG and PNG images are allowed"
                }

            # Calculate image hash
            image_hash = self.calculate_image_hash(image_data)

            # Check for duplicates
            if self.is_duplicate(image_hash):
                return {
                    "success": False,
                    "message": "This image has already been uploaded by another user",
                    "is_duplicate": True
                }

            # Optimize image
            optimized_data, optimized_size = self.optimize_image(image_data)

            # Generate unique filename
            unique_id = str(uuid.uuid4())
            filename = f"entries/{user_id}/{unique_id}.jpg"

            # Create user directory
            user_dir = os.path.join(self.storage_dir, "entries", str(user_id))
            os.makedirs(user_dir, exist_ok=True)

            # Save to local filesystem
            local_path = os.path.join(self.storage_dir, filename)
            with open(local_path, 'wb') as f:
                f.write(optimized_data)

            # Generate local URL (will be served by FastAPI static files)
            image_url = f"http://localhost:{settings.API_PORT}/local-images/{filename}"

            logger.info(f"🔧 DEV MODE: Image saved locally")
            logger.info(f"   Path: {local_path}")
            logger.info(f"   URL: {image_url}")
            logger.info(f"   Size: {optimized_size:,} bytes")

            return {
                "success": True,
                "image_url": image_url,
                "image_hash": image_hash,
                "filename": filename,
                "size": optimized_size
            }

        except Exception as e:
            logger.error(f"❌ Upload failed: {str(e)}")
            return {
                "success": False,
                "message": f"Upload failed: {str(e)}"
            }

    def delete_image(self, filename: str) -> bool:
        """Delete image from local storage"""
        try:
            local_path = os.path.join(self.storage_dir, filename)
            if os.path.exists(local_path):
                os.remove(local_path)
                logger.info(f"🔧 DEV MODE: Deleted local image: {filename}")
                return True
            return False
        except Exception as e:
            logger.error(f"❌ Delete failed: {str(e)}")
            return False

    async def check_duplicate(self, file: UploadFile) -> bool:
        """Check if uploaded file is duplicate"""
        try:
            image_data = await file.read()
            await file.seek(0)  # Reset file pointer
            image_hash = self.calculate_image_hash(image_data)
            is_dup = self.is_duplicate(image_hash)
            if is_dup:
                logger.info(f"🔧 DEV MODE: Duplicate image detected (hash: {image_hash})")
            return is_dup
        except Exception as e:
            logger.error(f"❌ Duplicate check failed: {str(e)}")
            return False
