# 🌴 نظام إدارة عزبة النخيل - دليل النشر والتشغيل
# EBD Farm Management System - Deployment Guide

---

## المتطلبات
- Node.js 18+
- حساب Supabase (https://supabase.com)
- حساب Vercel (https://vercel.com)
- حساب GitHub (https://github.com)

---

## الخطوة 1: إعداد Supabase

### 1.1 إنشاء مشروع Supabase
1. اذهب إلى https://supabase.com/dashboard
2. اضغط "New Project"
3. اختر اسم المشروع: `ebd-farm`
4. اختر كلمة مرور قوية لقاعدة البيانات
5. اختر أقرب Region (مثلاً `eu-central-1` لأقرب منطقة)

### 1.2 تشغيل قاعدة البيانات
1. اذهب إلى **SQL Editor** في لوحة تحكم Supabase
2. انسخ محتوى الملف `supabase/migrations/001_initial_schema.sql`
3. الصقه في المحرر واضغط **Run**
4. تأكد من ظهور رسالة "Success"

### 1.3 الحصول على المفاتيح
1. اذهب إلى **Settings > API**
2. انسخ:
   - `Project URL` → هذا هو `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public key` → هذا هو `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → هذا هو `SUPABASE_SERVICE_ROLE_KEY` (للترحيل فقط)

### 1.4 إعداد Authentication
1. اذهب إلى **Authentication > Providers**
2. تأكد من تفعيل Email provider
3. (اختياري) أوقف "Confirm email" للتجربة من **Authentication > Settings**

---

## الخطوة 2: إعداد المشروع محلياً

```bash
# انسخ المشروع
cd ebd-farm-system/app

# ثبت المكتبات
npm install

# أنشئ ملف البيئة
cp .env.local.example .env.local

# عدّل .env.local بالمفاتيح من Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## الخطوة 3: ترحيل البيانات الموجودة

```bash
# ضع ملف الإكسل بجانب السكريبت
cp "شيت محاسبي للمزارع0 (1).xlsx" scripts/

# شغّل الترحيل
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_KEY=eyJ... \
node scripts/migrate-data.mjs "scripts/شيت محاسبي للمزارع0 (1).xlsx"
```

هذا سينقل:
- ✅ هيكل المزارع (5 قطاعات، 17 مزرعة، 25 حوشة)
- ✅ المصروفات (~25,000 سجل)
- ✅ المبيعات (~166 سجل)
- ✅ اذونات الصرف
- ✅ جرد الفسائل (من بيانات الـ PDF)

---

## الخطوة 4: إنشاء حساب المالك

1. شغّل المشروع محلياً: `npm run dev`
2. اذهب إلى http://localhost:3000
3. أنشئ حساب جديد (هذا سيكون حساب المالك)
4. في Supabase SQL Editor، نفّذ:

```sql
-- غيّر الإيميل لإيميلك
UPDATE profiles SET role = 'owner'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

---

## الخطوة 5: رفع على GitHub

```bash
cd ebd-farm-system

# أنشئ مستودع جديد
git init
git add .
git commit -m "Initial commit - EBD Farm Management System"

# أنشئ مستودع على GitHub ثم:
git remote add origin https://github.com/YOUR_USERNAME/ebd-farm-system.git
git branch -M main
git push -u origin main
```

---

## الخطوة 6: النشر على Vercel

### عبر واجهة Vercel:
1. اذهب إلى https://vercel.com/new
2. اختر Import Git Repository
3. اختر مستودع `ebd-farm-system`
4. في إعدادات المشروع:
   - **Root Directory**: `app`
   - **Framework Preset**: Next.js
5. أضف Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = قيمته من Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = قيمته من Supabase
6. اضغط **Deploy**

### بعد النشر:
- أضف رابط Vercel في Supabase:
  - **Authentication > URL Configuration > Site URL**: `https://your-app.vercel.app`
  - **Redirect URLs**: أضف `https://your-app.vercel.app/**`

---

## الخطوة 7: إعداد المستخدمين

بعد النشر، أنشئ حسابات للفريق:

| المستخدم | الدور | الصلاحيات |
|----------|-------|-----------|
| المالك | `owner` | كل الصلاحيات |
| المحاسب | `accountant` | الماليات + التقارير |
| مدير المزرعة | `manager` | إدخال بيانات + مهام |
| العامل | `worker` | عرض المهام فقط |

1. كل مستخدم ينشئ حسابه من صفحة التسجيل
2. المالك يذهب لصفحة الإعدادات ويغير أدوارهم

---

## هيكل النظام
```
📁 ebd-farm-system/
├── 📁 supabase/
│   └── migrations/001_initial_schema.sql    ← قاعدة البيانات
├── 📁 app/
│   ├── 📁 src/
│   │   ├── 📁 app/
│   │   │   ├── auth/page.tsx                ← تسجيل الدخول
│   │   │   ├── dashboard/page.tsx            ← لوحة التحكم
│   │   │   ├── accounting/
│   │   │   │   ├── expenses/page.tsx        ← المصروفات
│   │   │   │   ├── sales/page.tsx           ← المبيعات
│   │   │   │   └── vouchers/page.tsx        ← اذونات الصرف
│   │   │   ├── operations/
│   │   │   │   ├── palms/page.tsx           ← سجل النخيل
│   │   │   │   ├── seedlings/page.tsx       ← جرد الفسائل
│   │   │   │   └── tasks/page.tsx           ← المهام
│   │   │   └── settings/page.tsx            ← الإعدادات
│   │   ├── 📁 components/                   ← المكونات
│   │   ├── 📁 hooks/                        ← الخطافات
│   │   ├── 📁 lib/                          ← المكتبات
│   │   └── 📁 types/                        ← الأنواع
│   ├── 📁 scripts/
│   │   └── migrate-data.mjs                 ← سكريبت ترحيل البيانات
│   └── package.json
└── DEPLOYMENT_GUIDE.md                      ← هذا الملف
```

---

## الميزات

### المحاسبة 💰
- تسجيل المصروفات بالتصنيف والمزرعة
- تسجيل المبيعات مع حساب الصافي
- اذونات الصرف والرواتب
- تصدير البيانات CSV

### العمليات 🌴
- سجل النخيل التفصيلي بالحوشات
- جرد الفسائل (زراعة/بيع/ترقيع)
- إدارة المهام والأولويات

### لوحة التحكم 📊
- إحصائيات لحظية
- رسوم بيانية (مصروفات/إيرادات شهرية)
- توزيع المصروفات بالنوع
- آخر المعاملات والإشعارات

### الأمان 🔒
- 4 مستويات صلاحية (مالك/محاسب/مدير/عامل)
- Row Level Security على كل الجداول
- سجل تدقيق لكل العمليات

### التنبيهات 🔔
- تنبيهات تجاوز الميزانية
- إشعارات المهام
- تنبيهات الدفع المعلق

---

## التوصيات للتطوير المستقبلي

1. **تطبيق موبايل** - تحويل لـ PWA لاستخدامه من الهاتف في المزرعة
2. **تقارير PDF** - إنشاء تقارير شهرية قابلة للطباعة
3. **صور وإيضالات** - رفع صور الإيصالات مع كل مصروف
4. **خرائط المزرعة** - خريطة تفاعلية لموقع الحوشات
5. **تتبع الري** - جدولة وتتبع عمليات الري
6. **تنبؤات المحصول** - بناء على بيانات السنوات السابقة
7. **تكامل WhatsApp** - إرسال التنبيهات عبر واتساب
8. **نظام المخزون** - تتبع مخزون الأسمدة والمبيدات
9. **تقرير الأرباح والخسائر** - P&L بالمزرعة والمحصول
10. **نسخ احتياطي تلقائي** - جدولة نسخ احتياطي أسبوعي
