import React, { useState, useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { extractResumeFromPlainText, sendMessageToAI } from '../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';
// Note: The worker import is now handled differently in modern Vite setups.
// The below line might not be necessary if you have pdfjs-dist as a direct dependency.
import 'pdfjs-dist/build/pdf.worker.mjs';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const MAX_SIZE_MB = 8;

const WelcomeForm: React.FC = () => {
  const setOriginalResumeText = useAppStore(s => s.setOriginalResumeText);
  const setTargetJobPosting = useAppStore(s => s.setTargetJobPosting);
  const goToChat = useAppStore(s => s.goToChat);
  const addChatMessage = useAppStore(s => s.addChatMessage);

  const [jobText, setJobText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onSelectFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('נא להעלות קובץ PDF בלבד'); return; }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) { setError(`גודל קובץ גדול מ-${MAX_SIZE_MB}MB`); return; }
    setError(null); setFile(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onSelectFile(e.target.files[0]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) onSelectFile(e.dataTransfer.files[0]);
  }, []);

  const prevent = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const extractPdfText = async (f: File): Promise<string> => {
    const arrayBuf = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = (content.items as any[]).map(it => it.str).join(' ');
      text += '\n' + pageText;
    }
    return text;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('נא לצרף קובץ PDF'); return; }
    setLoading(true);
    setError(null);

    try {
      // Step 1: Extract text and job info
      const pdfText = await extractPdfText(file);
      setOriginalResumeText(pdfText);
      if (jobText.trim()) {
        setTargetJobPosting(jobText.trim());
      }

      // Step 2: Get the fully parsed resume from the first AI call
      const initialParseResult = await extractResumeFromPlainText(pdfText);
      if (!initialParseResult.ok) {
        throw new Error(initialParseResult.error || 'Failed to parse resume from PDF');
      }

      // Step 3: Send the second AI call with the now-populated resume data
      const updatedState = useAppStore.getState();
      const aiResponse = await sendMessageToAI(
        `היי, כשאתה מקבל את ההודעה הראשונה, פנה למשתמש בשמו ("${updatedState.compatibleResume.fullName}"), הצג את עצמך כמדריך לשיפור קורות חיים, הסבר בקצרה שתעזור לו להתאים את הקורות חיים למשרת היעד, ותזמין אותו לשתף מידע נוסף או שאלות.`
      );
      
      if (aiResponse.message) {
        addChatMessage(aiResponse.message, 'ai');
      }

      // Adaptive transition: only after AI response is processed
      goToChat();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה בקריאת PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-50 font-[Heebo] text-slate-800 relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(56,189,248,0.25),transparent_60%)]" />
      <div className="mx-auto max-w-5xl px-5 pt-14 pb-24 relative">
        <header className="mb-14 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-l from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            נתחיל מהקורות חיים שלך
          </h1>
          <p className="mt-4 max-w-2xl mx-auto leading-relaxed text-slate-600">
            העלה PDF ונחלץ עבורך מידע מובנה. אפשר להוסיף טקסט של משרת יעד כדי לחדד התאמות חכמות.
          </p>
        </header>

        <form onSubmit={submit} className="relative group mx-auto max-w-3xl">
          <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-indigo-300/50 via-indigo-200/40 to-cyan-200/50 opacity-0 blur-xl transition group-hover:opacity-100" />
          <div className="relative rounded-3xl border border-indigo-100 bg-white/90 backdrop-blur-sm px-8 py-10 shadow-[0_4px_20px_-5px_rgba(99,102,241,0.15),0_10px_30px_-10px_rgba(14,165,233,0.15)]">
            <div className="grid gap-10">
              {/* Upload */}
              <div
                onDrop={onDrop}
                onDragOver={prevent}
                onDragEnter={prevent}
                onDragLeave={prevent}
                className={`rounded-2xl border-2 border-dashed px-8 py-16 transition flex flex-col items-center text-center
                  ${file
                    ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-white'
                    : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/60'}
                `}
              >
                <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileInput} />
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-indigo-300/40" />
                    <div className="relative rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 p-4 text-white shadow-lg shadow-indigo-300/40">
                      <svg width="34" height="34" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 16V4m0 0L8 8m4-4 4 4" />
                        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">
                    {file ? (
                      <span className="font-semibold text-indigo-600">{file.name}</span>
                    ) : (
                      <>
                        גרור ושחרר כאן את קובץ ה־PDF
                        <br />
                        <span className="text-xs text-slate-400">או לחץ לבחירה ידנית</span>
                      </>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-500 to-cyan-500 px-7 py-2.5 text-sm font-medium text-white shadow hover:brightness-105 active:scale-[.97] focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      בחר קובץ
                    </button>
                    {file && (
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="rounded-lg border border-indigo-200 bg-white/70 px-4 py-2 text-xs text-slate-600 hover:bg-indigo-50"
                      >
                        הסרה
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">PDF עד {MAX_SIZE_MB}MB</p>
                </div>
              </div>

              {/* Job posting */}
              <div className="space-y-3">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
                  טקסט משרת יעד (אופציונלי)
                </label>
                <div className="relative">
                  <textarea
                    dir="rtl"
                    rows={7}
                    className="w-full resize-none rounded-xl border border-indigo-100 bg-white/70 px-5 py-4 text-sm leading-relaxed text-slate-700 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400"
                    placeholder="הדבק כאן דרישות / מודעת משרה..."
                    value={jobText}
                    onChange={e => setJobText(e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-slate-500">משפיע על תקציר, נקודות ומיומנויות.</p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-9 py-3 text-sm font-semibold text-white shadow hover:from-indigo-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {loading ? 'מעבד...' : 'המשך לצ׳אט'}
                </button>
                {!file && <span className="text-xs text-slate-500">נדרש קובץ PDF כדי להמשיך</span>}
              </div>
            </div>
          </div>
        </form>

        <footer className="mt-14 text-center text-[11px] text-slate-500">
          עיבוד ראשוני בדפדפן לפני שליחה ל-AI. הימנע ממידע רגיש מאוד.
        </footer>
      </div>
    </div>
  );
};

export default WelcomeForm;