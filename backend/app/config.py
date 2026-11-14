from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / '.env')

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '').strip()
MODEL_NAME = os.getenv('MODEL_NAME', 'gpt-4o-mini')

# Allow deployments to configure their browser origins without editing code.
CORS_ORIGINS = list(dict.fromkeys([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    *(origin.strip().rstrip('/') for origin in os.getenv('CORS_ORIGINS', '').split(',') if origin.strip()),
]))
