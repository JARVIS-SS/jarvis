# Jarvis

مساعد شخصي تجريبي بواجهة عربية (Next.js) وواجهة API (FastAPI).

## ابدأ هنا
دليل التشغيل المحلي خطوة بخطوة بالعربية، لويندوز وmacOS وLinux، موجود في [`docs/LOCAL_SETUP_AR.md`](docs/LOCAL_SETUP_AR.md).

باختصار: ثبّت Node.js 20+ وPython 3.11+، شغّل الواجهة عبر `npm install --prefix frontend` ثم `npm run dev --prefix frontend`، وشغّل الخادم في طرفية ثانية عبر إنشاء `.venv` وتثبيت `backend/requirements.txt` ثم `python -m uvicorn backend.app.main:app --reload --port 8000`.

- واجهة التطبيق: http://localhost:3000
- فحص الخادم: http://localhost:8000/health
- وثائق API: http://localhost:8000/docs

انسخ `.env.example` إلى `.env` في جذر المشروع. مفتاح `OPENAI_API_KEY` اختياري لتشغيل الخادم، لكنه مطلوب لردود OpenAI. لا تضع الأسرار في ملفات الواجهة أو Git.

## تنبيه
هذه نسخة أولية للتطوير المحلي. لم يتم التحقق من تشغيلها على جهازك، كما أنها ليست جاهزة للنشر العام قبل مراجعة الاختبارات والأمان وإعداد HTTPS والنسخ الاحتياطي.
