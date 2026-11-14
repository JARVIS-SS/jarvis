from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.app.auth import get_current_user
from backend.app.db import get_connection

router = APIRouter(prefix='/api/memories', tags=['memory'])


class MemoryCreate(BaseModel):
    content: str = Field(min_length=1, max_length=500)


@router.get('')
def list_memories(user: dict = Depends(get_current_user)) -> dict:
    with get_connection() as conn:
        rows = conn.execute(
            'SELECT id, content, created_at FROM user_memories WHERE user_id = ? ORDER BY id DESC LIMIT 100',
            (user['id'],),
        ).fetchall()
    return {'memories': [dict(row) for row in rows]}


@router.post('', status_code=201)
def create_memory(request: MemoryCreate, user: dict = Depends(get_current_user)) -> dict:
    content = request.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail='اكتب معلومة قبل حفظها.')
    with get_connection() as conn:
        count = conn.execute('SELECT COUNT(*) FROM user_memories WHERE user_id = ?', (user['id'],)).fetchone()[0]
        if count >= 100:
            raise HTTPException(status_code=409, detail='وصلت للحد الأقصى وهو 100 معلومة. احذف بعض الذكريات أولًا.')
        cursor = conn.execute(
            'INSERT INTO user_memories (user_id, content) VALUES (?, ?)',
            (user['id'], content),
        )
        row = conn.execute(
            'SELECT id, content, created_at FROM user_memories WHERE id = ?',
            (cursor.lastrowid,),
        ).fetchone()
    return {'memory': dict(row)}


@router.delete('/{memory_id}', status_code=204)
def delete_memory(memory_id: int, user: dict = Depends(get_current_user)) -> None:
    with get_connection() as conn:
        cursor = conn.execute(
            'DELETE FROM user_memories WHERE id = ? AND user_id = ?',
            (memory_id, user['id']),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='المعلومة غير موجودة.')
