from __future__ import annotations
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / '.env')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '').strip()
MODEL_NAME = os.getenv('MODEL_NAME', 'gpt-4o-mini')
