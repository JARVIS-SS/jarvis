from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, Field

from backend.app.config import MODEL_NAME, OPENAI_API_KEY
from backend.app.db import get_connection

router = APIRouter(prefix='/api')


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=12000)


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    due_at: Optional[datetime] = None


class TaskUpdate(BaseModel):
    completed: bool


def task_to_dict(row) -> dict:
    return {
        'id': row['id'],
        'title': row['title'],
        'due_at': row['due_at'],
        'completed': bool(row['completed']),
        'created_at': row['created_at'],
    }


@router.get('/chat/history')
def get_chat_history(session_id: str = Query(default='default', min_length=1, max_length=100)) -> dict:
    with get_connection() as conn:
        rows = conn.execute(
            'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id ASC',
            (session_id,),
        ).fetchall()
    return {'messages': [{'role': row['role'], 'content': row['content']} for row in rows]}


@router.get('/tasks')
def list_tasks(session_id: str = Query(default='default', min_length=1, max_length=100)) -> dict:
    with get_connection() as conn:
        rows = conn.execute(
            'SELECT id, title, due_at, completed, created_at FROM tasks WHERE session_id = ? ORDER BY completed ASC, due_at IS NULL ASC, due_at ASC, id DESC',
            (session_id,),
        ).fetchall()
    return {'tasks': [task_to_dict(row) for row in rows]}


@router.post('/tasks', status_code=201)
def create_task(request: TaskCreate, session_id: str = Query(default='default', min_length=1, max_length=100)) -> dict:
    title = request.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail='اكتب عنوان المهمة.')
    due_at = request.due_at.isoformat() if request.due_at else None
    with get_connection() as conn:
        cursor = conn.execute(
            'INSERT INTO tasks (session_id, title, due_at) VALUES (?, ?, ?)',
            (session_id, title, due_at),
        )
        row = conn.execute(
            'SELECT id, title, due_at, completed, created_at FROM tasks WHERE id = ?',
            (cursor.lastrowid,),
        ).fetchone()
    return {'task': task_to_dict(row)}


@router.patch('/tasks/{task_id}')
def update_task(task_id: int, request: TaskUpdate, session_id: str = Query(default='default', min_length=1, max_length=100)) -> dict:
    with get_connection() as conn:
        cursor = conn.execute(
            'UPDATE tasks SET completed = ? WHERE id = ? AND session_id = ?',
            (int(request.completed), task_id, session_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='المهمة غير موجودة.')
        row = conn.execute(
            'SELECT id, title, due_at, completed, created_at FROM tasks WHERE id = ?',
            (task_id,),
        ).fetchone()
    return {'task': task_to_dict(row)}


@router.delete('/tasks/{task_id}', status_code=204)
def delete_task(task_id: int, session_id: str = Query(default='default', min_length=1, max_length=100)) -> None:
    with get_connection() as conn:
        cursor = conn.execute('DELETE FROM tasks WHERE id = ? AND session_id = ?', (task_id, session_id))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='المهمة غير موجودة.')


@router.post('/chat')
def chat(request: ChatRequest, session_id: str = Query(default='default', min_length=1, max_length=100)) -> dict[str, str]:
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail='اكتب رسالة أولًا.')

    with get_connection() as conn:
        history = conn.execute(
            'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id DESC LIMIT 20',
            (session_id,),
        ).fetchall()
    history_messages = [{'role': row['role'], 'content': row['content']} for row in reversed(history)]

    if not OPENAI_API_KEY:
        reply = 'وصلت رسالتك. لتفعيل الردود الذكية، أضف OPENAI_API_KEY إلى ملف .env ثم أعد تشغيل الخادم.'
    else:
        try:
            client = OpenAI(api_key=OPENAI_API_KEY)
            result = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {'role': 'system', 'content': 'أنت جارفيس، مساعد شخصي مفيد وواضح. أجب بلغة المستخدم، وبالعربية عند مخاطبتك بالعربية. لا تدّع تنفيذ أفعال خارجية.'},
                    *history_messages,
                    {'role': 'user', 'content': message},
                ],
            )
            reply = result.choices[0].message.content or 'لم يصل رد نصي من النموذج.'
        except OpenAIError:
            raise HTTPException(status_code=502, detail='تعذر الحصول على رد من مزود الذكاء الاصطناعي. تحقق من المفتاح وإعدادات الحساب.')

    with get_connection() as conn:
        conn.executemany(
            'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
            [(session_id, 'user', message), (session_id, 'assistant', reply)],
        )
    return {'reply': reply}
