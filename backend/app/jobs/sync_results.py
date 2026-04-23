import asyncio
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.services.result_sync import sync_latest_for_lottery

settings = get_settings()

async def main():
    db = SessionLocal()
    try:
        for lottery in settings.RESULT_SYNC_LOTTERIES:
            result = await sync_latest_for_lottery(db, lottery)
            print(f"synced {lottery}: contest {result.get('contest')}")
    finally:
        db.close()

if __name__ == '__main__':
    asyncio.run(main())
