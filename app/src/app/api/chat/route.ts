import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

const SYSTEM_PROMPT = `أنت "عبدالجليل" - مساعد زراعي ذكي متخصص في إدارة مزارع النخيل. أنت خبير زراعي محترف يتحدث بالعربية بأسلوب بسيط وعملي.

## معلومات المزرعة
- **الاسم**: عزبة النخيل
- **المالك**: المهندس أحمد عبدالجليل عبيد
- **الموقع**: محافظة الشرقية، مصر
- **النوع**: نخيل برحي
- **إجمالي النخيل**: 4,380 نخلة

## الهيكل الوظيفي
- م. عبدالجليل عبيد - مدير المزرعة
- م. عبدالرحمن أمجد - مهندس تنفيذي
- أحمد ماهر - مدير حسابات
- عبده حسن زيد - مشرف عام
- عبدالحميد أحمد - مشرف قطاع الـ 22 فدان
- محمد أحمد الصوري - مشرف قطاع الحصوة
- محمد فتحي - مشرف قطاع حوض البابور والشفعة
- عادل الصادق - مشرف قطاع الخطارة

## قطاعات المزرعة
1. قطاع الـ 22 فدان
2. قطاع الحصوة
3. قطاع حوض البابور والشفعة
4. قطاع الخطارة

## خبراتك الزراعية
أنت خبير في:
- زراعة ورعاية نخيل البرحي والتمور بجميع أنواعها
- التسميد (أنواعه، جرعاته، مواعيده، طرق إضافته)
- التلقيح (مواعيده، طرقه، أفضل الممارسات)
- الري (نظم الري، جدولة الري، كميات المياه)
- مكافحة الآفات والأمراض (سوسة النخيل، العناكب، الحشرات القشرية)
- العمليات الزراعية الموسمية (التقليم، التكريب، التوبير، الجني)
- تشخيص مشاكل النخيل من الأعراض
- إدارة المزارع والتخطيط الزراعي
- حساب التكاليف والأرباح الزراعية
- الطقس وتأثيره على النخيل

## تعليمات مهمة
1. تحدث دائماً بالعربية بأسلوب بسيط ومفهوم
2. عندما يسألك المستخدم عن بيانات التطبيق (مصروفات، مبيعات، مهام، إلخ)، استخدم البيانات المتوفرة في السياق
3. قدم نصائح عملية قابلة للتنفيذ
4. إذا لم تكن متأكداً من شيء، قل ذلك بصراحة
5. استخدم الأرقام والتواريخ عند الإمكان
6. كن ودوداً ومهنياً في نفس الوقت
7. عندما يسأل عن مشكلة زراعية، اسأل أسئلة توضيحية إذا لزم الأمر قبل التشخيص`;

async function fetchFarmData(supabase: any) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [expenses, sales, tasks, payments, recentExpenses, recentSales] = await Promise.all([
    supabase.from('expenses').select('total_amount, expense_category').eq('year', year).eq('month', month),
    supabase.from('sales').select('net_amount, total_amount, buyer_name, product_type').eq('year', year).eq('month', month),
    supabase.from('farm_tasks').select('title, status, priority, due_date, farm:farms(name)').in('status', ['pending', 'in_progress']).order('due_date', { ascending: true }).limit(10),
    supabase.from('payment_vouchers').select('amount, description, is_paid').eq('is_paid', false).limit(10),
    supabase.from('expenses').select('description, total_amount, expense_category, year, month, day').order('created_at', { ascending: false }).limit(10),
    supabase.from('sales').select('buyer_name, product_type, net_amount, total_amount, year, month').order('created_at', { ascending: false }).limit(10),
  ]);

  const totalExpenses = expenses.data?.reduce((s: number, e: any) => s + (e.total_amount || 0), 0) || 0;
  const totalRevenue = sales.data?.reduce((s: number, e: any) => s + (e.net_amount || e.total_amount || 0), 0) || 0;
  const activeTasks = tasks.data?.length || 0;
  const pendingPayments = payments.data?.length || 0;

  return `
## بيانات التطبيق الحالية (${month}/${year})

### ملخص مالي
- إجمالي المصروفات هذا الشهر: ${totalExpenses.toLocaleString('ar-EG')} ج.م
- إجمالي الإيرادات هذا الشهر: ${totalRevenue.toLocaleString('ar-EG')} ج.م
- صافي الربح: ${(totalRevenue - totalExpenses).toLocaleString('ar-EG')} ج.م

### المصروفات حسب النوع
${expenses.data?.reduce((acc: any, e: any) => {
  const cat = e.expense_category || 'أخرى';
  acc[cat] = (acc[cat] || 0) + (e.total_amount || 0);
  return acc;
}, {} as Record<string, number>) ? Object.entries(expenses.data?.reduce((acc: any, e: any) => {
  const cat = e.expense_category || 'أخرى';
  acc[cat] = (acc[cat] || 0) + (e.total_amount || 0);
  return acc;
}, {})).map(([k, v]) => `- ${k}: ${(v as number).toLocaleString('ar-EG')} ج.م`).join('\n') : 'لا توجد بيانات'}

### آخر المصروفات
${recentExpenses.data?.map((e: any) => `- ${e.description}: ${e.total_amount?.toLocaleString('ar-EG')} ج.م (${e.expense_category}) - ${e.year}/${e.month}/${e.day}`).join('\n') || 'لا توجد مصروفات'}

### آخر المبيعات
${recentSales.data?.map((s: any) => `- ${s.buyer_name || 'مشتري'}: ${(s.net_amount || s.total_amount)?.toLocaleString('ar-EG')} ج.م (${s.product_type || 'تمور'}) - ${s.year}/${s.month}`).join('\n') || 'لا توجد مبيعات'}

### المهام النشطة (${activeTasks} مهمة)
${tasks.data?.map((t: any) => `- ${t.title} [${t.status === 'in_progress' ? 'قيد التنفيذ' : 'معلقة'}] ${t.priority === 'urgent' ? '⚠️ عاجلة' : ''} - ${t.farm?.name || ''}`).join('\n') || 'لا توجد مهام'}

### مدفوعات معلقة (${pendingPayments})
${payments.data?.map((p: any) => `- ${p.description}: ${p.amount?.toLocaleString('ar-EG')} ج.م`).join('\n') || 'لا توجد مدفوعات معلقة'}
`;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'مفتاح API غير مُعد. يرجى إضافة GEMINI_API_KEY في إعدادات Vercel.' },
        { status: 500 }
      );
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'الرسائل مطلوبة' }, { status: 400 });
    }

    // Fetch farm data from Supabase
    const supabase = createServerSupabaseClient();
    let farmDataContext = '';
    try {
      farmDataContext = await fetchFarmData(supabase);
    } catch (err) {
      console.error('Error fetching farm data:', err);
      farmDataContext = '\n## بيانات التطبيق\nتعذر تحميل البيانات حالياً.\n';
    }

    const fullSystemPrompt = SYSTEM_PROMPT + '\n' + farmDataContext;

    // Convert messages to Gemini format
    const geminiContents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: fullSystemPrompt }],
        },
        contents: geminiContents,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error('Gemini API error:', errData);
      let errorDetail = 'حدث خطأ في الاتصال بالمساعد الذكي';
      try {
        const errJson = JSON.parse(errData);
        errorDetail = errJson?.error?.message || errorDetail;
      } catch {}
      return NextResponse.json(
        { error: errorDetail, debug: `Status: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أتمكن من الرد.';

    return NextResponse.json({ message: assistantMessage });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}
