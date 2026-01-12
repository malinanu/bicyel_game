"""
Mock Image Service for Development
Saves images to local filesystem instead of Cloudflare R2
"""
import os
import logging
from PIL import Image
from imagehash import phash, average_hash, dhash, whash, hex_to_hash
from io import BytesIO
from typing import Tuple, Dict, List
from fastapi import UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.entry import Entry
from app.config import settings
from datetime import datetime, timedelta
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
        count = self.db.query(Entry.id).filter(
            Entry.image_hash == image_hash
        ).count()
        return count > 0

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

    def calculate_all_hashes(self, image_data: bytes) -> Dict[str, str]:
        """Calculate all 4 hash types for comprehensive fraud detection"""
        image = Image.open(BytesIO(image_data))

        return {
            'phash': str(phash(image)),
            'ahash': str(average_hash(image)),
            'dhash': str(dhash(image)),
            'whash': str(whash(image))
        }

    def hamming_distance(self, hash1: str, hash2: str) -> int:
        """Calculate Hamming distance between two hashes"""
        try:
            h1 = hex_to_hash(hash1)
            h2 = hex_to_hash(hash2)
            return h1 - h2
        except Exception:
            return 999

    def find_similar_images(self, hashes: Dict[str, str], user_id: int) -> List[Dict]:
        """Find similar images using Hamming distance comparison"""
        # Query recent entries (performance optimization)
        recent_entries = self.db.query(
            Entry.id, Entry.user_id, Entry.created_at,
            Entry.image_hash, Entry.hash_ahash, Entry.hash_dhash, Entry.hash_whash
        ).order_by(Entry.created_at.desc()).limit(settings.FRAUD_COMPARISON_LIMIT).all()

        similar_images = []

        for entry in recent_entries:
            # Calculate Hamming distance for all hash types
            distances = {
                'phash': self.hamming_distance(hashes['phash'], entry.image_hash or ''),
                'ahash': self.hamming_distance(hashes['ahash'], entry.hash_ahash or '') if entry.hash_ahash else 999,
                'dhash': self.hamming_distance(hashes['dhash'], entry.hash_dhash or '') if entry.hash_dhash else 999,
                'whash': self.hamming_distance(hashes['whash'], entry.hash_whash or '') if entry.hash_whash else 999
            }

            min_distance = min(distances.values())

            # If ANY hash is similar, flag it
            if min_distance < settings.FRAUD_SIMILARITY_THRESHOLD:
                similar_images.append({
                    'entry_id': entry.id,
                    'user_id': entry.user_id,
                    'similarity_scores': {**distances, 'min_distance': min_distance},
                    'created_at': entry.created_at
                })

        return similar_images

    def calculate_fraud_score(self, similar_images: List[Dict], user_id: int) -> Tuple[float, Dict]:
        """Calculate fraud probability score (0.0-1.0)"""
        if not similar_images:
            return 0.0, {'signals': [], 'total_similar_images': 0}

        # Get closest match
        closest = min(similar_images, key=lambda x: x['similarity_scores']['min_distance'])
        min_distance = closest['similarity_scores']['min_distance']

        # Base score from Hamming distance
        if min_distance <= 2:
            base_score = 1.0  # Exact or near-exact match
        elif min_distance <= 5:
            base_score = 0.95  # Very similar (minor edits like scribbles)
        elif min_distance <= 10:
            base_score = 0.7   # Similar (noticeable modifications)
        else:
            base_score = 0.4

        # Cross-user penalty (same image, different users = fraud)
        is_cross_user = closest['user_id'] != user_id
        cross_user_penalty = 0.15 if is_cross_user else -0.1

        # Multiple matches penalty
        multiple_penalty = min(0.2, len(similar_images) * 0.05)

        # Check user submission frequency
        recent_submissions = self.db.query(func.count(Entry.id)).filter(
            Entry.user_id == user_id,
            Entry.created_at >= datetime.now() - timedelta(hours=1)
        ).scalar()

        frequency_penalty = 0.15 if recent_submissions >= 3 else 0

        final_score = base_score + cross_user_penalty + multiple_penalty + frequency_penalty
        final_score = max(0.0, min(1.0, final_score))

        # Build fraud reason
        signals = []
        if min_distance <= 5:
            signals.append(f"Very similar image found (distance: {min_distance})")
        if is_cross_user:
            signals.append("Cross-user duplicate detected")
        if len(similar_images) > 1:
            signals.append(f"Multiple similar images found ({len(similar_images)})")
        if recent_submissions >= 3:
            signals.append(f"High submission frequency ({recent_submissions} in last hour)")

        fraud_reason = {
            'total_similar_images': len(similar_images),
            'closest_match': {
                'entry_id': closest['entry_id'],
                'user_id': closest['user_id'],
                'min_distance': min_distance
            },
            'signals': signals,
            'recommendation': 'manual_review' if final_score >= 0.75 else 'auto_approve'
        }

        return final_score, fraud_reason

    def detect_fraud(self, image_data: bytes, user_id: int) -> Dict:
        """Main fraud detection pipeline"""
        # Calculate all hashes
        hashes = self.calculate_all_hashes(image_data)

        # Find similar images
        similar_images = self.find_similar_images(hashes, user_id)

        # Calculate fraud score
        fraud_score, fraud_reason = self.calculate_fraud_score(similar_images, user_id)

        # Extract similar entry IDs
        similar_entry_ids = [img['entry_id'] for img in similar_images]

        logger.info(f"🔧 DEV MODE: Fraud detection completed")
        logger.info(f"   Fraud score: {fraud_score:.2f}")
        logger.info(f"   Similar images found: {len(similar_images)}")

        return {
            'hashes': hashes,
            'fraud_score': fraud_score,
            'fraud_reason': fraud_reason,
            'similar_entry_ids': similar_entry_ids,
            'similar_images': similar_images
        }
