from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import CORS_ORIGINS
from backend.app.db import init_db
from backend.app.routes.auth import router as auth_router
from backend.app.routes.chat import router as api_router
from backend.app.routes.memory import router as memory_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


app = FastAPI(title='Jarvis API', version='0.5.0', lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type'],
)

app.include_router(auth_router)
app.include_router(api_router)
app.include_router(memory_router)


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok', 'service': 'jarvis-backend'}
