# نظام إدارة عزبة النخيل - Palm Farm Management System

## معلومات المزرعة

- **المالك**: المهندس أحمد عبدالجليل عبيد
- **إجمالي النخيل**: 4,380 نخلة
- **النوع**: نخيل برحي
- **الموقع**: محافظة الشرقية، مصر

## الهيكل الوظيفي

| الاسم | المنصب |
|-------|--------|
| م. عبدالجليل عبيد | مدير المزرعة |
| م. عبدالرحمن أمجد | مهندس تنفيذي |
| أحمد ماهر | مدير حسابات |
| عبده حسن زيد | مشرف عام |
| عبدالحميد أحمد | مشرف قطاع الـ 22 فدان |
| محمد أحمد الصوري | مشرف قطاع الحصوة |
| محمد فتحي | مشرف قطاع حوض البابور والشفعة |
| عادل الصادق | مشرف قطاع الخطارة |

## قطاعات المزرعة

1. **قطاع الـ 22 فدان** - مشرف: عبدالحميد أحمد
2. **قطاع الحصوة** - مشرف: محمد أحمد الصوري
3. **قطاع حوض البابور والشفعة** - مشرف: محمد فتحي
4. **قطاع الخطارة** - مشرف: عادل الصادق

## التقنيات المستخدمة

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth + PostgreSQL + Realtime + RLS)
- **Deployment**: Vercel (auto-deploy from GitHub)
- **GitHub**: `abdelglilebeid-hub/ebd-farm-system`
- **Vercel Project**: `prj_KHjn5QX7BOPqXh08a3CVPT1vTru9`

## ملاحظات فنية مهمة

- Supabase client يجب أن يكون singleton (ملف `lib/supabase.ts`)
- Realtime subscriptions تحتاج أسماء قنوات فريدة (`Date.now()`)
- Recharts يجب أن تستخدم dynamic import مع `{ ssr: false }`
- Git CLI لا يعمل بسبب index.lock — استخدم GitHub API عبر Chrome
