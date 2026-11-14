# Jarvis

Starter لمساعد شخصي بالذكاء الاصطناعي، بواجهة عربية (Next.js) وواجهة API (FastAPI).

## المتطلبات
- Node.js 20+
- Python 3.11+
- مفتاح OpenAI اختياري لتفعيل الردود الذكية

## التشغيل المحلي

1. انسخ `.env.example` إلى `.env` في مجلد المشروع الرئيسي، وأضف `OPENAI_API_KEY` لتفعيل الاتصال بالنموذج.
2. ثبّت تبعيات الواجهة وشغّلها:

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

3. في نافذة طرفية ثانية، جهّز وشغّل الخادم:

```bash
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

افتح http://localhost:3000. فحص الخادم: http://localhost:8000/health. وثائق API: http://localhost:8000/docs.

## المتغيرات
`OPENAI_API_KEY` مفتاح اختياري؛ لا تضعه في الواجهة أو في Git. `MODEL_NAME` اسم النموذج (افتراضي `gpt-4o-mini`). `NEXT_PUBLIC_API_URL` عنوان API (افتراضي `http://localhost:8000`).

من دون مفتاح API، يعمل التطبيق في وضع تجريبي ويرد برسالة توضح ذلك. هذه نسخة تأسيسية وليست بعدُ مساعدًا متكاملًا: لا تتضمن حاليًا تسجيل دخول أو حفظ محادثات أو تنفيذ مهام خارجية. أضف هذه المزايا مع المصادقة والأذونات قبل الاستخدام الفعلي.

## البنية
- `frontend/`: واجهة Next.js وTypeScript.
- `backend/`: FastAPI ومتحكم محادثة بسيط.
- `.env.example`: قالب إعدادات آمن بلا مفاتيح حقيقية.

## التطوير التالي
المصادقة، قاعدة بيانات للمحادثات والمهام، صوت، وتكاملات خارجية بعد إضافة ضوابط الإذن والأمان.
