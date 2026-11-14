'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };
type Task = { id: number; title: string; due_at: string | null; completed: boolean; created_at: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SESSION_ID = 'default';
const taskUrl = `${API_URL}/api/tasks?session_id=${SESSION_ID}`;

export default function HomePage() {
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

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch(taskUrl);
      if (!response.ok) throw new Error('تعذر تحميل المهام.');
      const data = await response.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'تعذر تحميل المهام.');
    }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/chat/history?session_id=${SESSION_ID}`)
      .then((response) => response.json())
      .then((data) => setMessages(Array.isArray(data.messages) ? data.messages : []))
      .catch(() => setMessages([]));
    loadTasks();
    if ('Notification' in window) setNotificationsEnabled(Notification.permission === 'granted');
  }, [loadTasks]);

  useEffect(() => {
    const interval = window.setInterval(loadTasks, 30000);
    return () => window.clearInterval(interval);
  }, [loadTasks]);

  useEffect(() => {
    if (!notificationsEnabled || !('Notification' in window)) return;
    const now = Date.now();
    tasks.forEach((task) => {
      if (!task.completed && task.due_at && new Date(task.due_at).getTime() <= now && !notifiedTaskIds.has(task.id)) {
        new Notification('تذكير من جارفيس', { body: task.title });
        notifiedTaskIds.add(task.id);
      }
    });
  }, [tasks, notificationsEnabled, notifiedTaskIds]);

  async function enableNotifications() {
    if (!('Notification' in window)) {
      setNotice('المتصفح لا يدعم إشعارات سطح المكتب. ستظل المهام ظاهرة هنا.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
    setNotice(permission === 'granted' ? 'تم تفعيل إشعارات التذكير.' : 'لم يتم السماح بالإشعارات؛ ستظل التذكيرات ظاهرة داخل التطبيق.');
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;
    setTaskError('');
    try {
      const response = await fetch(taskUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, due_at: taskDue ? new Date(taskDue).toISOString() : null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'تعذر إضافة المهمة.');
      setTasks((items) => [data.task, ...items]);
      setTaskTitle('');
      setTaskDue('');
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'تعذر إضافة المهمة.');
    }
  }

  async function toggleTask(task: Task) {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${task.id}?session_id=${SESSION_ID}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'تعذر تحديث المهمة.');
      setTasks((items) => items.map((item) => item.id === task.id ? data.task : item));
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'تعذر تحديث المهمة.');
    }
  }

  async function deleteTask(taskId: number) {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${taskId}?session_id=${SESSION_ID}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('تعذر حذف المهمة.');
      setTasks((items) => items.filter((item) => item.id !== taskId));
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'تعذر حذف المهمة.');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = prompt.trim();
    if (!message || loading) return;
    setMessages((items) => [...items, { role: 'user', content: message }]);
    setPrompt('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat?session_id=${SESSION_ID}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'حدث خطأ في الخادم');
      setMessages((items) => [...items, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages((items) => [...items, { role: 'assistant', content: error instanceof Error ? error.message : 'تعذر الاتصال بالخادم.' }]);
    } finally { setLoading(false); }
  }

  const dueTasks = tasks.filter((task) => !task.completed && task.due_at && new Date(task.due_at).getTime() <= Date.now());

  return <main className="shell">
    <header className="topbar"><div className="brand"><div className="logo">J</div><div><span className="eyebrow">مساعدك الشخصي</span><h1>جارفيس</h1></div></div><span className="status"><i /> جاهز</span></header>
    <section className="hero"><span className="eyebrow">مساحة العمل</span><h2>أهلًا بك، كيف أساعدك؟</h2><p>اسأل، خطّط، أو ابدأ محادثة جديدة.</p></section>

    <section className="tasks-panel" aria-labelledby="tasks-heading">
      <div className="section-heading"><div><span className="eyebrow">خطط ليومك</span><h2 id="tasks-heading">المهام والتذكيرات</h2></div><button className="secondary-button" type="button" onClick={enableNotifications}>{notificationsEnabled ? 'الإشعارات مفعّلة' : 'تفعيل الإشعارات'}</button></div>
      <form className="task-form" onSubmit={handleTaskSubmit}>
        <input aria-label="عنوان المهمة" maxLength={200} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="ما المهمة التي تريد تذكّرها؟" />
        <input aria-label="موعد التذكير" type="datetime-local" value={taskDue} onChange={(event) => setTaskDue(event.target.value)} />
        <button type="submit" disabled={!taskTitle.trim()}>إضافة مهمة</button>
      </form>
      {taskError && <p className="inline-error" role="alert">{taskError}</p>}
      {notice && <p className="inline-notice" role="status">{notice}</p>}
      {dueTasks.length > 0 && <p className="due-banner" role="status">لديك {dueTasks.length} تذكير مستحق الآن.</p>}
      {tasks.length === 0 ? <p className="task-empty">لا توجد مهام بعد. أضف مهمة أو موعد تذكير.</p> : <ul className="task-list">{tasks.map((task) => <li className={`task-item ${task.completed ? 'is-completed' : ''}`} key={task.id}>
        <button className="task-check" type="button" aria-label={task.completed ? 'إعادة فتح المهمة' : 'إنجاز المهمة'} onClick={() => toggleTask(task)}>{task.completed ? '✓' : ''}</button>
        <div className="task-copy"><span>{task.title}</span><small>{task.due_at ? `موعد التذكير: ${new Date(task.due_at).toLocaleString('ar-EG')}` : 'بدون موعد'}</small></div>
        <button className="delete-button" type="button" aria-label={`حذف ${task.title}`} onClick={() => deleteTask(task.id)}>حذف</button>
      </li>)}</ul>}
    </section>

    <section className="chat" aria-label="المحادثة">
      {messages.length === 0 ? <div className="empty"><div className="spark">✦</div><h3>ابدأ من هنا</h3><p>اكتب رسالتك في الأسفل، وسيجيبك جارفيس.</p><div className="suggestions"><button onClick={() => setPrompt('ساعدني في تنظيم يومي')}>نظّم يومي</button><button onClick={() => setPrompt('اقترح أفكارًا لمشروع جديد')}>اقترح أفكارًا</button><button onClick={() => setPrompt('لخّص لي موضوعًا أختاره')}>لخّص موضوعًا</button></div></div> : <div className="messages">{messages.map((item, index) => <article className={`message ${item.role}`} key={`${index}-${item.role}`}><span className="message-label">{item.role === 'user' ? 'أنت' : 'جارفيس'}</span><p>{item.content}</p></article>)}{loading && <article className="message assistant"><span className="message-label">جارفيس</span><p>يفكر...</p></article>}</div>}
    </section>
    <form className="composer" onSubmit={handleSubmit}><textarea aria-label="اكتب رسالتك" value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="اكتب رسالتك إلى جارفيس..." rows={2} /><div className="composer-footer"><span>Enter للإرسال · Shift + Enter لسطر جديد</span><button type="submit" disabled={loading || !prompt.trim()}>{loading ? 'جارٍ الإرسال…' : 'إرسال'} <span aria-hidden="true">↑</span></button></div></form>
    <footer>المحادثات والمهام محفوظة محليًا في قاعدة بيانات التطبيق</footer>
  </main>;
}
