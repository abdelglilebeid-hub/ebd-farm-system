'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, User, ArrowRight, Palmtree, Sparkles, Leaf, Calculator, Bug } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'أهلاً بيك! أنا عبدالجليل، مساعدك الزراعي الذكي 🌴\n\nأقدر أساعدك في كل ما يخص المزرعة - من بيانات المصروفات والمبيعات لحد النصائح الزراعية وتشخيص المشاكل.\n\nاسألني أي حاجة!',
  timestamp: new Date(),
};

const QUICK_PROMPTS = [
  { icon: Calculator, text: 'ملخص المصروفات والإيرادات', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { icon: Leaf, text: 'نصائح تسميد النخيل', color: 'bg-green-50 text-green-700 border-green-200' },
  { icon: Bug, text: 'تشخيص مشكلة في النخيل', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { icon: Sparkles, text: 'ما هي المهام المطلوبة؟', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = [...messages.filter(m => m.id !== 'welcome'), userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ');
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `عذراً، حدث خطأ: ${err?.message || 'حاول مرة أخرى'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return <li key={i} className="mr-4 mb-1">{line.substring(2)}</li>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold mb-1">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith('### ')) {
        return <p key={i} className="font-bold text-emerald-700 mb-1 mt-2">{line.slice(4)}</p>;
      }
      if (line.startsWith('## ')) {
        return <p key={i} className="font-bold text-lg text-emerald-800 mb-1 mt-2">{line.slice(3)}</p>;
      }
      return line ? <p key={i} className="mb-1">{line}</p> : <br key={i} />;
    });
  };

  const showQuickPrompts = messages.length <= 1;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-600 to-emerald-800 text-white shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
            title="العودة للوحة التحكم"
          >
            <ArrowRight size={20} />
          </Link>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Palmtree size={22} />
          </div>
          <div>
            <h1 className="font-bold text-lg">عبدالجليل</h1>
            <p className="text-emerald-100 text-sm">مساعدك الزراعي الذكي - عزبة النخيل</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div
                className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-md'
                    : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
                }`}
              >
                {formatMessage(msg.content)}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Bot size={18} />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-5 py-4">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick prompts */}
          {showQuickPrompts && (
            <div className="pt-4">
              <p className="text-gray-400 text-xs mb-3 text-center">اقتراحات سريعة</p>
              <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt.text)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:shadow-md hover:scale-[1.02] ${prompt.color}`}
                  >
                    <prompt.icon size={16} />
                    <span>{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك لعبدالجليل..."
              className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent max-h-32 min-h-[48px]"
              rows={1}
              dir="rtl"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">عبدالجليل مساعد ذكي يعمل بالذكاء الاصطناعي - النتائج قد تحتاج للمراجعة</p>
        </div>
      </div>
    </div>
  );
}
