'use client';
import { FormEvent, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = prompt.trim();
    if (!message || loading) return;
    setMessages((items) => [...items, { role: 'user', content: message }]);
    setPrompt('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'حدث خطأ في الخادم');
      setMessages((items) => [...items, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'تعذر الاتصال بالخادم. تأكد من تشغيل FastAPI.';
      setMessages((items) => [...items, { role: 'assistant', content: text }]);
    } finally { setLoading(false); }
  }

  return <main className="shell">
    <header className="topbar"><div className="brand"><div className="logo">J</div><div><span className="eyebrow">مساعدك الشخصي</span><h1>جارفيس</h1></div></div><span className="status"><i /> جاهز</span></header>
    <section className="hero"><span className="eyebrow">مساحة العمل</span><h2>أهلًا بك، كيف أساعدك؟</h2><p>اسأل، خطّط، أو ابدأ محادثة جديدة.</p></section>
    <section className="chat" aria-label="المحادثة">
      {messages.length === 0 ? <div className="empty"><div className="spark">✦</div><h3>ابدأ من هنا</h3><p>اكتب رسالتك في الأسفل، وسيجيبك جارفيس.</p><div className="suggestions"><button onClick={() => setPrompt('ساعدني في تنظيم يومي')}>نظّم يومي</button><button onClick={() => setPrompt('اقترح أفكارًا لمشروع جديد')}>اقترح أفكارًا</button><button onClick={() => setPrompt('لخّص لي موضوعًا أختاره')}>لخّص موضوعًا</button></div></div> : <div className="messages">{messages.map((item, index) => <article className={`message ${item.role}`} key={index}><span className="message-label">{item.role === 'user' ? 'أنت' : 'جارفيس'}</span><p>{item.content}</p></article>)}{loading && <article className="message assistant"><span className="message-label">جارفيس</span><p>يفكر...</p></article>}</div>}
    </section>
    <form className="composer" onSubmit={handleSubmit}><textarea aria-label="اكتب رسالتك" value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="اكتب رسالتك إلى جارفيس..." rows={2} /><div className="composer-footer"><span>Enter للإرسال · Shift + Enter لسطر جديد</span><button type="submit" disabled={loading || !prompt.trim()}>{loading ? 'جارٍ الإرسال…' : 'إرسال'} <span aria-hidden="true">↑</span></button></div></form>
    <footer>نسخة تأسيسية · لا تحفظ المحادثات بعد</footer>
  </main>;
}
