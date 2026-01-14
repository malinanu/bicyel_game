"""
Add test codes to the database for development/testing purposes.

Run this script to populate the database with sample codes:
    python add_test_codes.py
"""

from app.database import SessionLocal
from app.models.code import Code

def add_test_codes():
    """Add test codes to the database"""
    db = SessionLocal()

    try:
        # List of test codes
        test_codes = [
            'MILO2024',
            'WIN1000',
            'CGQSQC',
            'ENERGY1',
            'CHAMP25',
            'POWER99',
            'ACTIVE88',
            'STRONG77',
            'BOOST66',
            'WINNER55'
        ]

        added_count = 0
        existing_count = 0

        print("=" * 50)
        print("Adding Test Codes to Database")
        print("=" * 50)

        for code_str in test_codes:
            # Check if code already exists
            existing = db.query(Code).filter(Code.code == code_str).first()

            if not existing:
                code = Code(code=code_str, used=False)
                db.add(code)
                print(f"✅ Added: {code_str}")
                added_count += 1
            else:
                status = "USED" if existing.used else "Available"
                print(f"⏭️  Already exists: {code_str} ({status})")
                existing_count += 1

        db.commit()

        print("=" * 50)
        print(f"Summary:")
        print(f"  - Codes added: {added_count}")
        print(f"  - Codes already existed: {existing_count}")
        print(f"  - Total codes: {added_count + existing_count}")
        print("=" * 50)
        print("\n✅ Done! You can now use these codes in the app.")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_test_codes()
