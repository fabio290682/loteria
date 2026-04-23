from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.generated_game import GeneratedGame
from app.models.pool import Pool, PoolMember
from app.models.user import User
from app.schemas.game import GenerateGamesRequest
from app.schemas.pool import PoolCreateRequest, PoolDetailResponse, PoolMemberRequest, PoolResponse
from app.services.game_engine import generate_games
from app.services.plan_guard import enforce_generation_limit, enforce_pool_limit

router = APIRouter(prefix='/pools', tags=['pools'])


@router.post('', response_model=PoolResponse)
def create_pool(payload: PoolCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    enforce_pool_limit(db, user)
    pool = Pool(name=payload.name, lottery_type=payload.lottery_type, description=payload.description, quota_value=payload.quota_value, owner_id=user.id)
    db.add(pool)
    db.commit()
    db.refresh(pool)
    db.add(PoolMember(pool_id=pool.id, user_id=user.id, role='owner', quota_count=1))
    db.commit()
    return PoolResponse(id=pool.id, name=pool.name, lottery_type=pool.lottery_type, description=pool.description, quota_value=float(pool.quota_value), is_active=pool.is_active, owner_id=pool.owner_id, members_count=1, games_count=0)


@router.get('', response_model=list[PoolResponse])
def list_pools(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pools = db.query(Pool).filter(Pool.owner_id == user.id).order_by(Pool.id.desc()).all()
    return [PoolResponse(id=p.id, name=p.name, lottery_type=p.lottery_type, description=p.description, quota_value=float(p.quota_value), is_active=p.is_active, owner_id=p.owner_id, members_count=len(p.members), games_count=len(p.games)) for p in pools]


@router.get('/{pool_id}', response_model=PoolDetailResponse)
def get_pool(pool_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pool = db.query(Pool).filter(Pool.id == pool_id, Pool.owner_id == user.id).first()
    if not pool:
        raise HTTPException(status_code=404, detail='Bolão não encontrado')
    return PoolDetailResponse(
        id=pool.id,
        name=pool.name,
        lottery_type=pool.lottery_type,
        description=pool.description,
        quota_value=float(pool.quota_value),
        is_active=pool.is_active,
        owner_id=pool.owner_id,
        members_count=len(pool.members),
        games_count=len(pool.games),
        members=[{'id': m.id, 'user_id': m.user_id, 'email': m.user.email, 'role': m.role, 'quota_count': m.quota_count} for m in pool.members],
        games=[{'id': g.id, 'numbers': g.numbers, 'score': g.score} for g in pool.games],
    )


@router.post('/{pool_id}/members')
def add_member(pool_id: int, payload: PoolMemberRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pool = db.query(Pool).filter(Pool.id == pool_id, Pool.owner_id == user.id).first()
    if not pool:
        raise HTTPException(status_code=404, detail='Bolão não encontrado')
    target = db.query(User).filter(User.email == payload.email).first()
    if not target:
        raise HTTPException(status_code=404, detail='Usuário do membro não encontrado')
    existing = db.query(PoolMember).filter(PoolMember.pool_id == pool_id, PoolMember.user_id == target.id).first()
    if existing:
        raise HTTPException(status_code=400, detail='Membro já está no bolão')
    member = PoolMember(pool_id=pool_id, user_id=target.id, quota_count=payload.quota_count)
    db.add(member)
    db.commit()
    return {'status': 'added', 'member_email': target.email}


@router.post('/{pool_id}/generate-games')
def generate_pool_games(pool_id: int, payload: GenerateGamesRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pool = db.query(Pool).filter(Pool.id == pool_id, Pool.owner_id == user.id).first()
    if not pool:
        raise HTTPException(status_code=404, detail='Bolão não encontrado')
    enforce_generation_limit(db, user, payload.game_count)
    generated = generate_games(payload.model_dump())
    records = []
    for game in generated:
        record = GeneratedGame(lottery_type=payload.lottery_type, numbers=game['numbers'], score=game['score'], game_sum=game['sum'], even_count=game['even_count'], filters=payload.model_dump(), user_id=user.id, pool_id=pool_id, source='pool')
        db.add(record)
        records.append(record)
    db.commit()
    return {'status': 'created', 'pool_id': pool_id, 'games_created': len(records)}
