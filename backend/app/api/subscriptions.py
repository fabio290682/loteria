from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.subscription import CheckoutRequest, CheckoutResponse, PlanResponse, SubscriptionResponse
from app.services.payment_service import build_checkout, list_plans

router = APIRouter(prefix='/subscriptions', tags=['subscriptions'])


@router.get('/plans', response_model=list[PlanResponse])
def plans():
    return list_plans()


@router.post('/checkout', response_model=CheckoutResponse)
def create_checkout(payload: CheckoutRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        checkout = build_checkout(payload.plan, payload.provider)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    subscription = Subscription(provider=checkout['provider'], plan=payload.plan, status=checkout['status'], checkout_reference=checkout['reference'], checkout_url=checkout['checkout_url'], user_id=user.id)
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return checkout


@router.post('/activate/{plan}', response_model=SubscriptionResponse)
def activate_subscription(plan: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    subscription = Subscription(provider='internal-demo', plan=plan, status='active', checkout_reference=f'activated-{user.id}-{plan}', checkout_url=None, user_id=user.id)
    user.plan = plan
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@router.post('/webhook/{provider}')
async def payment_webhook(provider: str, request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    reference = payload.get('reference') or payload.get('data', {}).get('reference')
    status_value = payload.get('status') or payload.get('type') or 'received'
    subscription = db.query(Subscription).filter(Subscription.checkout_reference == reference).order_by(Subscription.id.desc()).first()
    if subscription:
        subscription.status = 'active' if str(status_value).lower() in {'paid', 'approved', 'checkout.session.completed', 'active'} else str(status_value)
        if subscription.status == 'active':
            subscription.user.plan = subscription.plan
        db.commit()
    return {'provider': provider, 'processed': bool(subscription), 'reference': reference, 'status': status_value}


@router.get('/me', response_model=list[SubscriptionResponse])
def my_subscriptions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Subscription).filter(Subscription.user_id == user.id).order_by(Subscription.id.desc()).all()
