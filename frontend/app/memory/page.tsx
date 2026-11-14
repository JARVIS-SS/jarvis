'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import './memory.css';

type Memory = { id: number; content: string; created_at: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MemoryPage() {
  const [token, setToken] = useState('');
  const [content, setContent] = useState('');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadMemories = useCallback(async (accessToken: string) => {
    const response = await fetch(`${API_URL}/api/memories`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error(response.status === 401 ? 'انتهت الجلسة. ارجع لتسجيل الدخول.' : 'تعذر تحميل الذاكرة.');
    const data = await response.json();
    setMemories(Array.isArray(data.memories) ? data.memories : []);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('jarvis_access_token');
    if (!saved) {
      setError('سجّل الدخول أولًا لإدارة ذاكرتك.');
      setLoading(false);
      return;
    }
    setToken(saved);
    loadMemories(saved)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'تعذر تحميل الذاكرة.'))
      .finally(() => setLoading(false));
  }, [loadMemories]);

  async function addMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = content.trim();
    if (!value || !token) return;
    setError(''); setNotice('');
    try {
      const response = await fetch(`${API_URL}/api/memories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'تعذر حفظ المعلومة.');
      setMemories((items) => [data.memory, ...items]);
      setContent('');
      setNotice('حُفظت المعلومة، وسيستخدمها جارفيس كسياق في محادثاتك.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر حفظ المعلومة.');
    }
  }

  async function removeMemory(memoryId: number) {
    if (!token) return;
    setError(''); setNotice('');
    try {
      const response = await fetch(`${API_URL}/api/memories/${memoryId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'تعذر حذف المعلومة.');
      }
      setMemories((items) => items.filter((item) => item.id !== memoryId));
      setNotice('تم حذف المعلومة من ذاكرتك.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر حذف المعلومة.');
    }
  }

  return <main className="memory-shell" dir="rtl">
    <header className="memory-header"><a href="/" className="memory-back">← العودة إلى جارفيس</a><span className="eyebrow">ذاكرة شخصية تحت تحكمك</span><h1>ما الذي تريد من جارفيس أن يتذكره؟</h1><p>أضف التفضيلات أو المعلومات التي تريد استخدامها كسياق في محادثاتك. لا يحفظ جارفيس أي شيء تلقائيًا.</p></header>
    <form className="memory-form" onSubmit={addMemory}>
      <label htmlFor="memory-content">معلومة جديدة</label>
      <textarea id="memory-content" value={content} maxLength={500} onChange={(event) => setContent(event.target.value)} placeholder="مثال: أفضل الإجابات المختصرة، وأعمل على مشروع لتعلم البرمجة." />
      <div className="memory-form-footer"><small>{content.length}/500 · لا تضف كلمات مرور أو معلومات شديدة الحساسية.</small><button type="submit" disabled={!token || !content.trim()}>حفظ في ذاكرتي</button></div>
    </form>
    {error && <p className="memory-error" role="alert">{error} <a href="/">تسجيل الدخول</a></p>}
    {notice && <p className="memory-notice" role="status">{notice}</p>}
    <section className="memory-list" aria-label="المعلومات المحفوظة">
      <div className="memory-list-heading"><h2>المعلومات المحفوظة</h2><span>{memories.length}/100</span></div>
      {loading ? <p className="memory-empty">جارٍ تحميل ذاكرتك…</p> : memories.length === 0 ? <p className="memory-empty">لا توجد معلومات محفوظة بعد. أضف ما تريد أن يتذكره جارفيس.</p> : <ul>{memories.map((memory) => <li key={memory.id}><p>{memory.content}</p><button type="button" onClick={() => removeMemory(memory.id)} aria-label="حذف المعلومة">حذف</button></li>)}</ul>}
    </section>
    <p className="memory-privacy">تُحفظ المعلومات في قاعدة بيانات حسابك، وتُرسل ضمن سياق المحادثة إلى مزود الذكاء الاصطناعي عند الرد. يمكنك حذفها في أي وقت.</p>
  </main>;
}
