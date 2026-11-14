'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };
type Task = { id: number; title: string; due_at: string | null; completed: boolean; created_at: string };
type ChatSession = { id: string; title: string; created_at: string; updated_at: string };
type User = { id: number; email: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HomePage() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prompt, setPrompt] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [notice, setNotice] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notifiedTaskIds = useMemo(() => new Set<number>(), []);
  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadSessions = useCallback(async (authToken = token) => {
    const response = await fetch(`${API_URL}/api/sessions`, { headers: { Authorization: `Bearer ${authToken}` } });
    if (!response.ok) throw new Error('تعذر تحميل المحادثات.');
    const data = await response.json();
    let next: ChatSession[] = Array.isArray(data.sessions) ? data.sessions : [];
    if (next.length === 0) {
      const created = await fetch(`${API_URL}/api/sessions`, { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } });
      if (!created.ok) throw new Error('تعذر إنشاء محادثة.');
      next = [(await created.json()).session];
    }
    setSessions(next);
    setActiveSession((current) => next.some((item) => item.id === current) ? current : next[0].id);
  }, [token]);

  const loadTasks = useCallback(async () => {
    if (!token || !activeSession) return;
    try {
      const response = await fetch(`${API_URL}/api/tasks?session_id=${encodeURIComponent(activeSession)}`, { headers: authHeaders() });
      if (!response.ok) throw new Error('تعذر تحميل المهام.');
      const data = await response.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setTaskError('');
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'تعذر تحميل المهام.');
    }
  }, [activeSession, authHeaders, token]);

  const loadHistory = useCallback(async () => {
    if (!token || !activeSession) return;
    try {
      const response = await fetch(`${API_URL}/api/chat/history?session_id=${encodeURIComponent(activeSession)}`, { headers: authHeaders() });
      if (!response.ok) throw new Error('تعذر تحميل سجل المحادثة.');
      const data = await response.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
      setMessages([]);
      setNotice(error instanceof Error ? error.message : 'تعذر تحميل المحادثة.');
    }
  }, [activeSession, authHeaders, token]);

  useEffect(() => {
    const saved = window.localStorage.getItem('jarvis_access_token');
    if (!saved) { setAuthReady(true); return; }
    setToken(saved);
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${saved}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('انتهت الجلسة. سجّل الدخول من جديد.');
        const data = await response.json();
        setUser(data.user);
        await loadSessions(saved);
      })
      .catch((error) => { window.localStorage.removeItem('jarvis_access_token'); setToken(''); setAuthError(error.message); })
      .finally(() => setAuthReady(true));
    if ('Notification' in window) setNotificationsEnabled(Notification.permission === 'granted');
  }, [loadSessions]);

  useEffect(() => { if (token && activeSession) { loadHistory(); loadTasks(); } }, [token, activeSession, loadHistory, loadTasks]);
  useEffect(() => {
    if (!token || !activeSession) return;
    const interval = window.setInterval(loadTasks, 30000);
    return () => window.clearInterval(interval);
  }, [loadTasks, token, activeSession]);
  useEffect(() => {
    if (!notificationsEnabled || !('Notification' in window)) return;
    tasks.forEach((task) => {
      if (!task.completed && task.due_at && new Date(task.due_at).getTime() <= Date.now() && !notifiedTaskIds.has(task.id)) {
        new Notification('تذكير من جارفيس', { body: task.title });
        notifiedTaskIds.add(task.id);
      }
    });
  }, [tasks, notificationsEnabled, notifiedTaskIds]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAuthError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/${authMode === 'login' ? 'login' : 'register'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'تعذر إتمام تسجيل الدخول.');
      window.localStorage.setItem('jarvis_access_token', data.access_token);
      setToken(data.access_token); setUser(data.user); setPassword('');
      await loadSessions(data.access_token);
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'حدث خطأ.'); }
  }

  async function logout() {
    try { await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', headers: authHeaders() }); } finally {
      window.localStorage.removeItem('jarvis_access_token'); setToken(''); setUser(null); setSessions([]); setActiveSession(''); setMessages([]); setTasks([]);
    }
  }

  async function createSession() {
    const response = await fetch(`${API_URL}/api/sessions`, { method: 'POST', headers: authHeaders() });
    if (!response.ok) { setNotice('تعذر إنشاء محادثة جديدة.'); return; }
    const data = await response.json(); setSessions((items) => [data.session, ...items]); setActiveSession(data.session.id);
  }

  async function deleteSession(sessionId: string) {
    if (sessions.length < 2) { setNotice('يجب الاحتفاظ بمحادثة واحدة على الأقل.'); return; }
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, { method: 'DELETE', headers: authHeaders() });
    if (!response.ok) { setNotice('تعذر حذف المحادثة.'); return; }
    const remaining = sessions.filter((item) => item.id !== sessionId); setSessions(remaining);
    if (activeSession === sessionId) setActiveSession(remaining[0].id);
  }

  async function enableNotifications() {
    if (!('Notification' in window)) { setNotice('المتصفح لا يدعم إشعارات سطح المكتب.'); return; }
    const permission = await Notification.requestPermission(); setNotificationsEnabled(permission === 'granted');
    setNotice(permission === 'granted' ? 'تم تفعيل إشعارات التذكير.' : 'لم يتم السماح بالإشعارات.');
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const title = taskTitle.trim(); if (!title || !activeSession) return; setTaskError('');
    try {
      const response = await fetch(`${API_URL}/api/tasks?session_id=${encodeURIComponent(activeSession)}`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, due_at: taskDue ? new Date(taskDue).toISOString() : null }),
      });
      const data = await response.json(); if (!response.ok) throw new Error(data.detail || 'تعذر إضافة المهمة.');
      setTasks((items) => [data.task, ...items]); setTaskTitle(''); setTaskDue('');
    } catch (error) { setTaskError(error instanceof Error ? error.message : 'تعذر إضافة المهمة.'); }
  }

  async function toggleTask(task: Task) {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${task.id}?session_id=${encodeURIComponent(activeSession)}`, { method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !task.completed }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.detail || 'تعذر تحديث المهمة.');
      setTasks((items) => items.map((item) => item.id === task.id ? data.task : item));
    } catch (error) { setTaskError(error instanceof Error ? error.message : 'تعذر تحديث المهمة.'); }
  }

  async function deleteTask(taskId: number) {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${taskId}?session_id=${encodeURIComponent(activeSession)}`, { method: 'DELETE', headers: authHeaders() });
      if (!response.ok) throw new Error('تعذر حذف المهمة.'); setTasks((items) => items.filter((item) => item.id !== taskId));
    } catch (error) { setTaskError(error instanceof Error ? error.message : 'تعذر حذف المهمة.'); }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const message = prompt.trim(); if (!message || loading || !activeSession) return;
    setMessages((items) => [...items, { role: 'user', content: message }]); setPrompt(''); setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat?session_id=${encodeURIComponent(activeSession)}`, { method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.detail || 'حدث خطأ في الخادم');
      setMessages((items) => [...items, { role: 'assistant', content: data.reply }]);
      setSessions((items) => items.map((item) => item.id === activeSession && item.title === 'محادثة جديدة' ? { ...item, title: message.slice(0, 48) } : item));
    } catch (error) { setMessages((items) => [...items, { role: 'assistant', content: error instanceof Error ? error.message : 'تعذر الاتصال بالخادم.' }]); }
    finally { setLoading(false); }
  }

  const dueTasks = tasks.filter((task) => !task.completed && task.due_at && new Date(task.due_at).getTime() <= Date.now());

  if (!authReady) return <main className="auth-shell"><p>جارٍ تحميل جارفيس…</p></main>;
  if (!user) return <main className="auth-shell"><form className="auth-card" onSubmit={handleAuth}>
    <div className="logo auth-logo">J</div><span className="eyebrow">مساعدك الشخصي</span><h1>{authMode === 'login' ? 'مرحبًا بعودتك' : 'أنشئ حسابك'}</h1><p>سجّل الدخول لحفظ محادثاتك ومهامك في حسابك.</p>
    <label>البريد الإلكتروني<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></label>
    <label>كلمة المرور<input type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={10} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="10 أحرف على الأقل" /></label>
    {authError && <p className="inline-error" role="alert">{authError}</p>}
    <button className="auth-submit" type="submit">{authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
    <button className="auth-switch" type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>{authMode === 'login' ? 'ليس لديك حساب؟ أنشئ حسابًا' : 'لديك حساب؟ سجّل الدخول'}</button>
  </form></main>;

  return <main className="shell">
    <header className="topbar"><div className="brand"><div className="logo">J</div><div><span className="eyebrow">مساعدك الشخصي</span><h1>جارفيس</h1></div></div><div className="account"><span className="status"><i /> {user.email}</span><button className="secondary-button" type="button" onClick={logout}>خروج</button></div></header>
    <section className="hero"><span className="eyebrow">مساحة العمل</span><h2>أهلًا بك، كيف أساعدك؟</h2><p>محادثاتك ومهامك محفوظة في حسابك.</p></section>
    <div className="workspace"><aside className="session-panel"><div className="section-heading"><h2>محادثاتي</h2><button className="new-session" type="button" onClick={createSession}>+ جديدة</button></div><ul className="session-list">{sessions.map((session) => <li className={session.id === activeSession ? 'selected-session' : ''} key={session.id}><button className="session-select" type="button" onClick={() => setActiveSession(session.id)}>{session.title}</button><button className="session-delete" type="button" aria-label={`حذف ${session.title}`} onClick={() => deleteSession(session.id)}>×</button></li>)}</ul></aside>
    <div className="workspace-main">
      <section className="tasks-panel" aria-labelledby="tasks-heading"><div className="section-heading"><div><span className="eyebrow">خطط ليومك</span><h2 id="tasks-heading">المهام والتذكيرات</h2></div><button className="secondary-button" type="button" onClick={enableNotifications}>{notificationsEnabled ? 'الإشعارات مفعّلة' : 'تفعيل الإشعارات'}</button></div>
        <form className="task-form" onSubmit={handleTaskSubmit}><input aria-label="عنوان المهمة" maxLength={200} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="ما المهمة التي تريد تذكّرها؟" /><input aria-label="موعد التذكير" type="datetime-local" value={taskDue} onChange={(event) => setTaskDue(event.target.value)} /><button type="submit" disabled={!taskTitle.trim()}>إضافة مهمة</button></form>
        {taskError && <p className="inline-error" role="alert">{taskError}</p>}{notice && <p className="inline-notice" role="status">{notice}</p>}{dueTasks.length > 0 && <p className="due-banner" role="status">لديك {dueTasks.length} تذكير مستحق الآن.</p>}
        {tasks.length === 0 ? <p className="task-empty">لا توجد مهام في هذه المحادثة بعد.</p> : <ul className="task-list">{tasks.map((task) => <li className={`task-item ${task.completed ? 'is-completed' : ''}`} key={task.id}><button className="task-check" type="button" aria-label={task.completed ? 'إعادة فتح المهمة' : 'إنجاز المهمة'} onClick={() => toggleTask(task)}>{task.completed ? '✓' : ''}</button><div className="task-copy"><span>{task.title}</span><small>{task.due_at ? `موعد التذكير: ${new Date(task.due_at).toLocaleString('ar-EG')}` : 'بدون موعد'}</small></div><button className="delete-button" type="button" aria-label={`حذف ${task.title}`} onClick={() => deleteTask(task.id)}>حذف</button></li>)}</ul>}
      </section>
      <section className="chat" aria-label="المحادثة">{messages.length === 0 ? <div className="empty"><div className="spark">✦</div><h3>ابدأ من هنا</h3><p>اكتب رسالتك في الأسفل، وسيجيبك جارفيس.</p><div className="suggestions"><button onClick={() => setPrompt('ساعدني في تنظيم يومي')}>نظّم يومي</button><button onClick={() => setPrompt('اقترح أفكارًا لمشروع جديد')}>اقترح أفكارًا</button><button onClick={() => setPrompt('لخّص لي موضوعًا أختاره')}>لخّص موضوعًا</button></div></div> : <div className="messages">{messages.map((item, index) => <article className={`message ${item.role}`} key={`${index}-${item.role}`}><span className="message-label">{item.role === 'user' ? 'أنت' : 'جارفيس'}</span><p>{item.content}</p></article>)}{loading && <article className="message assistant"><span className="message-label">جارفيس</span><p>يفكر...</p></article>}</div>}</section>
      <form className="composer" onSubmit={handleSubmit}><textarea aria-label="اكتب رسالتك" value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="اكتب رسالتك إلى جارفيس..." rows={2} /><div className="composer-footer"><span>Enter للإرسال · Shift + Enter لسطر جديد</span><button type="submit" disabled={loading || !prompt.trim()}>{loading ? 'جارٍ الإرسال…' : 'إرسال'} <span aria-hidden="true">↑</span></button></div></form>
    </div></div><footer>المحادثات والمهام مرتبطة بحسابك · تذكيرات المتصفح تعمل عند فتح التطبيق</footer>
  </main>;
}
