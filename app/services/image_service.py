import boto3
from PIL import Image
from imagehash import phash
from io import BytesIO
from typing import Optional, Tuple
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.entry import Entry
from app.config import settings
import uuid

class ImageService:
    def __init__(self, db: Session):
        self.db = db
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.R2_ENDPOINT_URL,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name='auto'
        )

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
        """Upload and process image"""
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
            filename = f"entries/{user_id}/{uuid.uuid4()}.jpg"

            # Upload to R2
            self.s3_client.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=filename,
                Body=optimized_data,
                ContentType='image/jpeg'
            )

            # Generate public URL
            image_url = f"{settings.R2_PUBLIC_URL}/{filename}"

            return {
                "success": True,
                "image_url": image_url,
                "image_hash": image_hash,
                "filename": filename,
                "size": optimized_size
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Upload failed: {str(e)}"
            }

    def delete_image(self, filename: str) -> bool:
        """Delete image from R2"""
        try:
            self.s3_client.delete_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=filename
            )
            return True
        except Exception:
            return False

    async def check_duplicate(self, file: UploadFile) -> bool:
        """Check if uploaded file is duplicate"""
        try:
            image_data = await file.read()
            await file.seek(0)  # Reset file pointer
            image_hash = self.calculate_image_hash(image_data)
            return self.is_duplicate(image_hash)
        except Exception:
            return False
