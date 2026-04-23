from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.schemas.dashboard import StatsResponse, DashboardStatsResponse
from app.schemas.analytics import LotteryType
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix='/dashboard', tags=['dashboard'])


@router.get('/stats', response_model=StatsResponse)
def get_dashboard_stats(
    lottery: LotteryType = Query(default='megasena'),
    db: Session = Depends(get_db),
):
    """Get dashboard statistics for a specific lottery."""
    service = DashboardService(db=db)
    stats = service.get_stats(lottery_type=lottery)
    return stats


@router.get('/overview')
def get_dashboard_overview(db: Session = Depends(get_db)):
    """Get complete dashboard overview with all metrics."""
    service = DashboardService(db=db)
    
    lotteries = ['megasena', 'quina', 'lotofacil']
    stats_by_lottery = {
        lottery: service.get_stats(lottery_type=lottery)
        for lottery in lotteries
    }
    
    return {
        'last_updated': datetime.now().isoformat(),
        'stats': stats_by_lottery,
        'summary': {
            'total_lotteries': len(lotteries),
            'total_contests': sum(s.contests_analyzed for s in stats_by_lottery.values()),
        }
    }


@router.get('/health')
def health_check():
    """Health check endpoint."""
    return {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
    }
