from fastapi import APIRouter, HTTPException
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, Field
from backend.app.config import MODEL_NAME, OPENAI_API_KEY

router = APIRouter(prefix='/api')

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=12000)

@router.post('/chat')
def chat(request: ChatRequest) -> dict[str, str]:
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail='اكتب رسالة أولًا.')
    if not OPENAI_API_KEY:
        return {'reply': 'وصلت رسالتك. لتفعيل الردود الذكية، أضف OPENAI_API_KEY إلى ملف .env ثم أعد تشغيل الخادم.'}
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        result = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {'role': 'system', 'content': 'أنت جارفيس، مساعد شخصي مفيد وواضح. أجب بلغة المستخدم، وبالعربية عند مخاطبتك بالعربية. لا تدّع تنفيذ أفعال خارجية.'},
                {'role': 'user', 'content': message},
            ],
        )
        reply = result.choices[0].message.content or 'لم يصل رد نصي من النموذج.'
        return {'reply': reply}
    except OpenAIError:
        raise HTTPException(status_code=502, detail='تعذر الحصول على رد من مزود الذكاء الاصطناعي. تحقق من المفتاح وإعدادات الحساب.')
