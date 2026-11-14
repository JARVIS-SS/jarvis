from fastapi import APIRouter, Depends
from backend.app.auth import Credentials, get_current_user, login_user, register_user, revoke_token

router = APIRouter(prefix='/api/auth', tags=['authentication'])


@router.post('/register', status_code=201)
def register(credentials: Credentials) -> dict:
    return register_user(credentials)


@router.post('/login')
def login(credentials: Credentials) -> dict:
    return login_user(credentials)


@router.get('/me')
def me(user: dict = Depends(get_current_user)) -> dict:
    return {'user': {'id': user['id'], 'email': user['email']}}


@router.post('/logout')
def logout(user: dict = Depends(get_current_user)) -> dict[str, bool]:
    revoke_token(user)
    return {'ok': True}
