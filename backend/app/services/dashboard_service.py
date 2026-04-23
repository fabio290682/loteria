from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.result_cache import ResultCache
from app.schemas.dashboard import StatsResponse


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_stats(self, lottery_type: str) -> StatsResponse:
        """Get dashboard statistics for a lottery type."""
        
        # Query results
        results = self.db.query(ResultCache).filter(
            ResultCache.lottery_type == lottery_type
        ).order_by(desc(ResultCache.created_at)).all()

        total_contests = len(results)
        
        # Calculate hot numbers (most frequent)
        number_frequency = {}
        for result in results[:30]:  # Last 30 contests
            if result.numbers:
                for num in result.numbers:
                    number_frequency[num] = number_frequency.get(num, 0) + 1
        
        hot_numbers = sorted(
            number_frequency.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]

        # Calculate delayed numbers (haven't appeared recently)
        latest_30_numbers = set()
        if results:
            for result in results[:30]:
                if result.numbers:
                    latest_30_numbers.update(result.numbers)

        all_numbers = set()
        for result in results:
            if result.numbers:
                all_numbers.update(result.numbers)

        delayed_numbers = all_numbers - latest_30_numbers
        
        # Calculate accuracy rate (example: based on hot numbers matching)
        if results and hot_numbers:
            matches = 0
            for result in results[:5]:
                if result.numbers:
                    hot_nums = set(n[0] for n in hot_numbers)
                    result_nums = set(result.numbers)
                    matches += len(hot_nums & result_nums)
            accuracy_rate = (matches / (5 * len(hot_numbers))) * 100 if hot_numbers else 0
        else:
            accuracy_rate = 0

        return StatsResponse(
            contests_analyzed=total_contests,
            contests_growth=5.2,  # Example growth %
            hot_numbers_count=len(hot_numbers),
            hot_numbers_change=2.1,
            delayed_numbers_count=len(delayed_numbers),
            delayed_numbers_change=-1.5,
            accuracy_rate=round(accuracy_rate, 1),
            accuracy_trend=3.7,
        )
