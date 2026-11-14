from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from backend.app.db import get_connection

bearer = HTTPBearer(auto_error=False)


class Credentials(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=10, max_length=128)


def _hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 310_000)
    return f'{salt.hex()}:{digest.hex()}'


def _password_matches(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split(':', 1)
        candidate = _hash_password(password, bytes.fromhex(salt_hex)).split(':', 1)[1]
        return secrets.compare_digest(candidate, digest_hex)
    except (ValueError, TypeError):
        return False


def _issue_token(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    expires = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    with get_connection() as conn:
        conn.execute(
            'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
            (user_id, token_hash, expires),
        )
    return token


def register_user(credentials: Credentials) -> dict:
    email = credentials.email.strip().lower()
    if '@' not in email or email.startswith('@') or email.endswith('@') or '.' not in email.rsplit('@', 1)[-1]:
        raise HTTPException(status_code=422, detail='أدخل بريدًا إلكترونيًا صحيحًا.')
    try:
        with get_connection() as conn:
            cursor = conn.execute(
                'INSERT INTO users (email, password_hash) VALUES (?, ?)',
                (email, _hash_password(credentials.password)),
            )
            user_id = cursor.lastrowid
    except Exception as exc:
        if 'UNIQUE constraint failed' in str(exc):
            raise HTTPException(status_code=409, detail='هذا البريد مسجل بالفعل.') from exc
        raise
    return {'access_token': _issue_token(user_id), 'token_type': 'bearer', 'user': {'id': user_id, 'email': email}}


def login_user(credentials: Credentials) -> dict:
    email = credentials.email.strip().lower()
    with get_connection() as conn:
        user = conn.execute('SELECT id, email, password_hash FROM users WHERE email = ?', (email,)).fetchone()
    if not user or not _password_matches(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail='البريد الإلكتروني أو كلمة المرور غير صحيحة.')
    return {'access_token': _issue_token(user['id']), 'token_type': 'bearer', 'user': {'id': user['id'], 'email': user['email']}}


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    if not credentials or credentials.scheme.lower() != 'bearer':
        raise HTTPException(status_code=401, detail='سجّل الدخول للمتابعة.')
    token_hash = hashlib.sha256(credentials.credentials.encode('utf-8')).hexdigest()
    with get_connection() as conn:
        row = conn.execute(
            'SELECT users.id, users.email FROM auth_sessions JOIN users ON users.id = auth_sessions.user_id WHERE auth_sessions.token_hash = ? AND auth_sessions.expires_at > ?',
            (token_hash, datetime.now(timezone.utc).isoformat()),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail='انتهت الجلسة. سجّل الدخول مرة أخرى.')
    return {'id': row['id'], 'email': row['email'], 'token_hash': token_hash}


def revoke_token(user: dict) -> None:
    with get_connection() as conn:
        conn.execute('DELETE FROM auth_sessions WHERE token_hash = ? AND user_id = ?', (user['token_hash'], user['id']))
