from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.db import init_db
from backend.app.routes.auth import router as auth_router
from backend.app.routes.chat import router as api_router

app = FastAPI(title='Jarvis API', version='0.3.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
    allow_credentials=False,
    allow_methods=['GET', 'POST', 'PATCH', 'DELETE'],
    allow_headers=['Authorization', 'Content-Type'],
)

init_db()
app.include_router(auth_router)
app.include_router(api_router)


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok', 'service': 'jarvis-backend'}
