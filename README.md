# Jarvis

مساعد شخصي تجريبي بواجهة عربية (Next.js) وواجهة API (FastAPI) مع حفظ المحادثات والمهام في SQLite محليًا.

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

## المزايا الحالية
- محادثة عربية مع مزود OpenAI عند إعداد المفتاح.
- حفظ سجل المحادثة والمهام في SQLite داخل `backend/data/jarvis.db`.
- إنشاء المهام، تعيين موعد اختياري، تحديد الإنجاز والحذف.
- تنبيهات المتصفح للمهام المستحقة عند فتح التطبيق وبعد السماح بالإشعارات.

## حدود مهمة
هذه نسخة أولية لمستخدم محلي واحد، بلا تسجيل دخول أو عزل آمن بين المستخدمين. معرف الجلسة الحالي افتراضي. التذكير عبر إشعارات المتصفح يعمل فقط عندما تكون صفحة التطبيق مفتوحة؛ لا توجد إشعارات خلفية أو جوال عندما يكون التطبيق مغلقًا. قبل النشر أو استخدامه من عدة أشخاص، يلزم إضافة المصادقة وعزل البيانات ومراجعة الأمان.
