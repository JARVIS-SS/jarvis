import './voice-controls.css';
import { useEffect, useRef, useState } from 'react';

type SpeechRecognitionResultLike = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionEventLike = { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

type VoiceControlsProps = {
  onTranscript: (transcript: string) => void;
  textToSpeak: string;
};

export default function VoiceControls({ onTranscript, textToSpeak }: VoiceControlsProps) {
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [message, setMessage] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  function toggleRecording() {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setMessage('التعرّف على الصوت غير مدعوم في هذا المتصفح. جرّب Chrome أو Edge أو اكتب رسالتك.');
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'ar-EG';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index])
        .filter((result) => result?.isFinal)
        .map((result) => result[0].transcript)
        .join(' ')
        .trim();
      if (transcript) {
        onTranscript(transcript);
        setMessage('تم تحويل كلامك إلى نص. راجعه ثم أرسله.');
      }
    };
    recognition.onerror = (event) => {
      setMessage(event.error === 'not-allowed' ? 'اسمح للمتصفح باستخدام الميكروفون لتفعيل الإدخال الصوتي.' : 'تعذر التعرّف على الصوت. حاول مرة أخرى أو اكتب رسالتك.');
      setRecording(false);
    };
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    setMessage('');
    setRecording(true);
    try {
      recognition.start();
    } catch {
      setRecording(false);
      setMessage('تعذر بدء الميكروفون. تحقق من صلاحيات المتصفح.');
    }
  }

  function toggleSpeech() {
    if (!('speechSynthesis' in window)) {
      setMessage('قراءة الرد صوتيًا غير مدعومة في هذا المتصفح.');
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    if (!textToSpeak.trim()) {
      setMessage('أرسل رسالة أولًا ليقرأ جارفيس رده.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ar-EG';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setMessage('تعذرت قراءة الرد. جرّب متصفحًا آخر.');
    };
    setMessage('');
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="voice-controls" aria-label="التحكم الصوتي">
      <div className="voice-buttons">
        <button className={`voice-button ${recording ? 'is-recording' : ''}`} type="button" onClick={toggleRecording} aria-pressed={recording}>
          <span aria-hidden="true">{recording ? '■' : '🎙'}</span> {recording ? 'إيقاف التسجيل' : 'تحدث إلى جارفيس'}
        </button>
        <button className="voice-button" type="button" onClick={toggleSpeech} aria-pressed={speaking} disabled={!textToSpeak.trim()}>
          <span aria-hidden="true">{speaking ? '■' : '🔊'}</span> {speaking ? 'إيقاف القراءة' : 'استمع للرد'}
        </button>
      </div>
      {recording && <p className="voice-status" role="status">جارٍ الاستماع… تكلّم الآن.</p>}
      {message && <p className="voice-status" role="status">{message}</p>}
      <p className="voice-hint">الصوت يستخدم ميزات المتصفح؛ قد يطلب إذن الميكروفون، وتختلف اللغة والأصوات المتاحة حسب الجهاز.</p>
    </div>
  );
}
