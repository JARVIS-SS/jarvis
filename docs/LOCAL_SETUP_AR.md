# تشغيل Jarvis محليًا (دليل عربي)

هذا الدليل لتشغيل الواجهة والخادم محليًا على جهازك. يلزم Node.js 20 أو أحدث وPython 3.11 أو أحدث. لا تحتاج مفتاح OpenAI لتشغيل التطبيق، لكنه مطلوب لردود نموذج الذكاء الاصطناعي.

## Windows (PowerShell)

افتح مجلد المشروع بعد تنزيله من GitHub، ثم شغّل الأوامر التالية من جذر المشروع.

### 1. إعداد البيئة

```powershell
Copy-Item .env.example .env
notepad .env
```

أضف مفتاحك إلى `OPENAI_API_KEY` إذا كان متوفرًا. لا ترسل المفتاح لأحد ولا تضعه في ملفات الواجهة أو في Git. الواجهة تستخدم `http://localhost:8000` افتراضيًا؛ إذا غيّرت العنوان، أنشئ `frontend/.env.local` وضع فيه `NEXT_PUBLIC_API_URL=http://localhost:8000` (عدّل العنوان حسب إعدادك).

### 2. تشغيل الواجهة

في نافذة PowerShell أولى:

```powershell
npm install --prefix frontend
npm run dev --prefix frontend
```

اتركها تعمل، وافتح نافذة PowerShell ثانية في مجلد المشروع.

### 3. تشغيل الخادم

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```

إذا منع PowerShell تفعيل البيئة، شغّل هذا الأمر في النافذة الحالية فقط ثم أعد أمر التفعيل:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### 4. فتح التطبيق والتحقق

- التطبيق: http://localhost:3000
- فحص الخادم: http://localhost:8000/health
- وثائق API التفاعلية: http://localhost:8000/docs

من PowerShell، يمكنك اختبار الفحص الصحي:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

## macOS أو Linux

من جذر المشروع، جهّز البيئة وثبّت التبعيات:

```bash
cp .env.example .env
# عدّل .env وضع OPENAI_API_KEY عند الحاجة
npm install --prefix frontend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

شغّل كل خدمة في نافذة طرفية منفصلة:

```bash
npm run dev --prefix frontend
```

```bash
source .venv/bin/activate
python -m uvicorn backend.app.main:app --reload --port 8000
```

ثم افتح http://localhost:3000.

## تسجيل الدخول والصوت والبيانات

- إذا ظهرت صفحة تسجيل الدخول أو إنشاء الحساب، أنشئ حسابًا للاستخدام المحلي.
- ملف SQLite ينشأ عند تشغيل الخادم في `data/jarvis.db` إذا كانت قاعدة البيانات مهيأة في النسخة التي تستخدمها. احتفظ بنسخة احتياطية منه عند الحاجة، ولا ترفعه إلى Git.
- الإدخال الصوتي يعتمد على دعم المتصفح وطلب إذن الميكروفون. استخدم localhost أو HTTPS؛ وقد لا تدعم بعض المتصفحات التعرف على الكلام أو العربية.
- إعداد `OPENAI_API_KEY` اختياري للتشغيل، لكنه ضروري للحصول على ردود فعلية من OpenAI. أعد تشغيل الخادم بعد تعديل `.env`.

## استكشاف الأخطاء

- **`npm` أو `python` غير معروف:** ثبّت Node.js وPython وأعد فتح الطرفية للتأكد من تحديث PATH.
- **المنفذ 3000 أو 8000 مستخدم:** أوقف العملية القديمة أو اختر منفذًا آخر للخادم، ثم حدّث `NEXT_PUBLIC_API_URL` في `frontend/.env.local` ليتطابق معه.
- **الواجهة لا تتصل بالخادم:** تأكد من تشغيل الخادمين في نافذتين، وافحص `/health`. إذا غيّرت عنوان API، تحقق من قيمة `NEXT_PUBLIC_API_URL` ثم أعد تشغيل Next.js.
- **أخطاء المكتبات:** من جذر المشروع أعد تشغيل `npm install --prefix frontend`، ثم فعّل `.venv` وأعد `python -m pip install -r backend/requirements.txt`.
- **رد تجريبي أو خطأ من مزود الذكاء الاصطناعي:** راجع المفتاح واسم النموذج في `.env`، وتأكد من أن حسابك ومفتاحك يسمحان باستخدام النموذج.
- **الميكروفون لا يعمل:** اسمح بالوصول إليه من إعدادات المتصفح، واستخدم متصفحًا يدعم Web Speech API. يظل بإمكانك الكتابة يدويًا.

## تنبيه
هذا مشروع تطوير محلي أولي، وليس إعداد نشر إنتاجي. لم يُجرَ تشغيل أو اختبار آلي على جهاز المستخدم من خلال هذا الدليل. قبل نشره للآخرين، يلزم اختبار المسارات الفعلية، وإعداد HTTPS، وحماية الأسرار والبيانات والنسخ الاحتياطية.
