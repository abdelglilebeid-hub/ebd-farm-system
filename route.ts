import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `أنت "عبدالجليل" - المساعد الزراعي الذكي لعزبة النخيل (مزرعة نخيل برحي، 115 فدان، الشرقية - مصر).

## شخصيتك:
- اسمك عبدالجليل ودي عزبتك وأنت بتحبها
- بتتكلم بالعربي البسيط الواضح (مصري)
- عندك خبرة كبيرة في زراعة النخيل والبرحي بالذات
- ردودك عملية ومختصرة - مش أكاديمية
- لو حد سألك عن حاجة مش زراعية، رد عليه بلطف إنك متخصص في الزراعة

## معلومات العزبة:
- المساحة: 115 فدان (5 قطاعات: 22فدان، البابور، الحصوه، الشفعه، الخطارة)
- النوع: نخيل برحي (حوالي 4,780 نخلة) + 186 نخلة ذكر
- المالك: م. أحمد عبدالجليل عبيد
- الموقع: الشرقية، مصر

## قدراتك:
1. **تحليل البيانات**: لو المستخدم سأل عن مصروفات أو مبيعات أو مهام، استخدم البيانات اللي هتتبعتلك
2. **نصائح زراعية**: تسميد، ري، تلقيح، مكافحة آفات، تقليم، حصاد البرحي
3. **تشخيص مشاكل**: لو حد وصفلك مشكلة في النخيل، ساعده يشخصها ويحلها
4. **معلومات عامة**: أي حاجة تخص زراعة النخيل والتمور

## قواعد مهمة:
- لو مفيش بيانات (أرقام صفر أو فاضية)، قول كده بوضوح
- لو مش متأكد من حاجة، قول "مش متأكد 100% بس..."
- استخدم إيموجي 🌴 بس متكترش
- خليك مختصر - الفلاح وقته مهم`;

// Fetch farm data from Supabase for context
async function fetchFarmData() {
  try {
    const supabase = await createServerSupabaseClient();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [
      { data: expenses },
      { data: sales },
      { data: tasks },
      { data: vouchers },
      { data: recentExpenses },
      { data: recentSales }
    ] = await Promise.all([
      supabase.from('expenses').select('total_amount, expense_category').eq('year', year).eq('month', month),
      supabase.from('sales').select('net_amount, total_amount, buyer_name, product_type').eq('year', year).eq('month', month),
      supabase.from('farm_tasks').select('title, status, priority, due_date, farm:farms(name)').order('due_date', { ascending: true }).limit(10),
      supabase.from('payment_vouchers').select('amount, description, is_paid').eq('is_paid', false),
      supabase.from('expenses').select('description, total_amount, expense_category').order('created_at', { ascending: false }).limit(10),
      supabase.from('sales').select('buyer_name, product_type, net_amount, total_amount').order('created_at', { ascending: false }).limit(10),
    ]);

    const totalExpenses = expenses?.reduce((sum: number, e: any) => sum + (e.total_amount || 0), 0) || 0;
    const totalSales = sales?.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0) || 0;
    const pendingVouchers = vouchers?.reduce((sum: number, v: any) => sum + (v.amount || 0), 0) || 0;
    const activeTasks = tasks?.filter((t: any) => t.status !== 'completed') || [];

    return {
      currentMonth: `${year}-${month}`,
      totalExpenses,
      totalSales,
      profit: totalSales - totalExpenses,
      pendingVouchers,
      activeTasks: activeTasks.length,
      tasksList: activeTasks.slice(0, 5),
      recentExpenses: recentExpenses?.slice(0, 5) || [],
      recentSales: recentSales?.slice(0, 5) || [],
      expensesByCategory: expenses?.reduce((acc: any, e: any) => {
        acc[e.expense_category] = (acc[e.expense_category] || 0) + (e.total_amount || 0);
        return acc;
      }, {}) || {},
    };
  } catch (error) {
    console.error('Error fetching farm data:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'الرسائل مطلوبة' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY is not set');
      return NextResponse.json({ error: 'المساعد الذكي غير مفعّل حالياً' }, { status: 500 });
    }

    // Fetch farm data for context
    const farmData = await fetchFarmData();
    let contextMessage = '';
    if (farmData) {
      contextMessage = `\n\n--- بيانات العزبة الحالية (${farmData.currentMonth}) ---
مصروفات الشهر: ${farmData.totalExpenses} ج.م.
إيرادات الشهر: ${farmData.totalSales} ج.م.
صافي الربح: ${farmData.profit} ج.م.
مدفوعات معلقة: ${farmData.pendingVouchers} ج.م.
مهام نشطة: ${farmData.activeTasks}
${farmData.tasksList.length > 0 ? 'المهام: ' + JSON.stringify(farmData.tasksList) : ''}
${farmData.recentExpenses.length > 0 ? 'آخر المصروفات: ' + JSON.stringify(farmData.recentExpenses) : ''}
${farmData.recentSales.length > 0 ? 'آخر المبيعات: ' + JSON.stringify(farmData.recentSales) : ''}
توزيع المصروفات: ${JSON.stringify(farmData.expensesByCategory)}
---`;
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + contextMessage },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error('Groq API error:', errData);
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
    const reply = data.choices?.[0]?.message?.content || 'معرفتش أرد، جرب تاني';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في المعالجة' },
      { status: 500 }
    );
  }
}
