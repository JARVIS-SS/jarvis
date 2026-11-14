# Jarvis

مساعد شخصي تجريبي بواجهة عربية (Next.js) وواجهة API (FastAPI). يدعم حسابات محلية، جلسات محادثة متعددة، مهامًا، تذكيرات، وذاكرة شخصية اختيارية.

## التشغيل

راجع [دليل التشغيل المحلي بالعربية](docs/LOCAL_SETUP_AR.md) لتعليمات Windows وmacOS وLinux. باختصار:

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

وفي نافذة أخرى:

```bash
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```

افتح `http://localhost:3000`. فحص الخادم `http://localhost:8000/health`، ووثائق API `http://localhost:8000/docs`. انسخ `.env.example` إلى `.env` وأضف مفتاح OpenAI اختياريًا لتفعيل الردود الذكية.

## الميزات
- تسجيل حساب ودخول وخروج، وسجل منفصل لكل مستخدم.
- جلسات محادثة متعددة وسجل محفوظ.
- مهام وتذكيرات مرتبطة بالمحادثات وإشعارات متصفح اختيارية أثناء فتح التطبيق.
- إدخال صوتي وقراءة صوتية عبر ميزات المتصفح المدعومة.
- ذاكرة شخصية اختيارية، يضيفها المستخدم ويحذفها بنفسه، وتُستخدم كسياق لردود النموذج.

## الفحوصات والاختبارات

```bash
python -m pip install -r backend/requirements.txt
python -m pytest -q backend/tests
npm install --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

تُشغّل هذه الفحوصات تلقائيًا على كل push وطلب سحب عبر GitHub Actions. إعداد `CORS_ORIGINS` اختياري؛ عيّن قائمة origins مفصولة بفواصل عند تشغيل الواجهة من نطاق مختلف عن `localhost:3000`.

## الخصوصية والحدود
لا تحفظ معلومات شديدة الحساسية. عند تفعيل مزود الذكاء الاصطناعي، تُرسل الذكريات التي أضفتها صراحة ضمن سياق الطلب إلى مزود الذكاء الاصطناعي. هذا مشروع تطوير محلي أولي، وليس إعداد نشر إنتاجي.
