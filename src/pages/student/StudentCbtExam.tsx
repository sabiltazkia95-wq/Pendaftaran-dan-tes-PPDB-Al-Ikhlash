import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Clock,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  BookmarkCheck,
  Send,
  Loader2,
  Check
} from 'lucide-react';

interface StudentCbtExamProps {
  examId: string;
  navigate: (path: string) => void;
  onExit: () => void;
}

export const StudentCbtExam: React.FC<StudentCbtExamProps> = ({ examId, navigate, onExit }) => {
  const { studentProfile } = useAuth();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selected_option_id?: string | null; essay_answer?: string | null; marked_for_review?: boolean }>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const pendingSyncRef = useRef<Set<string>>(new Set());

  // Online status listener with automatic resync
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Auto flush pending unsaved queue when reconnecting
      if (attemptId && pendingSyncRef.current.size > 0) {
        setSaveStatus('saving');
        try {
          const qIds = Array.from(pendingSyncRef.current);
          for (const qId of qIds) {
            const ans = answers[qId];
            if (ans) {
              await api.saveExamAnswer({
                attempt_id: attemptId,
                question_id: qId,
                selected_option_id: ans.selected_option_id,
                essay_answer: ans.essay_answer,
                marked_for_review: ans.marked_for_review
              });
              pendingSyncRef.current.delete(qId);
            }
          }
          setSaveStatus('saved');
        } catch (err) {
          console.error('Failed to sync offline queue on reconnect:', err);
          setSaveStatus('error');
        }
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [attemptId, answers]);

  // Initialize Exam Session
  useEffect(() => {
    const initExam = async () => {
      try {
        setLoading(true);
        // Start or retrieve active attempt
        const startRes = await api.startExam(examId);
        setAttemptId(startRes.attempt_id);
        setRemainingSeconds(startRes.remaining_seconds);

        // Fetch sanitized questions
        const qRes = await api.getExamQuestions(examId);
        setQuestions(qRes.questions);

        // Populate saved answers
        const initialAnswers: Record<string, any> = {};
        qRes.questions.forEach((q: any) => {
          if (q.saved_answer) {
            initialAnswers[q.id] = {
              selected_option_id: q.saved_answer.selected_option_id,
              essay_answer: q.saved_answer.essay_answer,
              marked_for_review: q.saved_answer.marked_for_review
            };
          }
        });
        setAnswers(initialAnswers);
      } catch (err: any) {
        console.error('Init CBT error:', err);
        setInitError(err.message || 'Gagal memulai sesi ujian.');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [examId]);

  // Countdown Timer
  useEffect(() => {
    if (loading || isCompleted || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isCompleted, attemptId]);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Save answer to server with offline retry tracking
  const saveAnswerToServer = async (
    qId: string,
    optId: string | null = null,
    essay: string | null = null,
    review: boolean = false
  ) => {
    if (!attemptId) return;
    setSaveStatus('saving');
    try {
      await api.saveExamAnswer({
        attempt_id: attemptId,
        question_id: qId,
        selected_option_id: optId,
        essay_answer: essay,
        marked_for_review: review
      });
      pendingSyncRef.current.delete(qId);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to save answer (marked for offline queue):', err);
      pendingSyncRef.current.add(qId);
      setSaveStatus('error');
    }
  };

  // Handle Option Select
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    const current = answers[currentQuestion.id] || {};
    const updated = {
      ...current,
      selected_option_id: optionId
    };
    setAnswers({
      ...answers,
      [currentQuestion.id]: updated
    });
    saveAnswerToServer(currentQuestion.id, optionId, current.essay_answer, current.marked_for_review);
  };

  // Handle Essay Text Change
  const handleEssayChange = (text: string) => {
    if (!currentQuestion) return;
    const current = answers[currentQuestion.id] || {};
    const updated = {
      ...current,
      essay_answer: text
    };
    setAnswers({
      ...answers,
      [currentQuestion.id]: updated
    });
  };

  const handleEssayBlur = () => {
    if (!currentQuestion) return;
    const current = answers[currentQuestion.id] || {};
    saveAnswerToServer(currentQuestion.id, current.selected_option_id, current.essay_answer, current.marked_for_review);
  };

  // Toggle Review
  const handleToggleReview = () => {
    if (!currentQuestion) return;
    const current = answers[currentQuestion.id] || {};
    const newReview = !current.marked_for_review;
    const updated = {
      ...current,
      marked_for_review: newReview
    };
    setAnswers({
      ...answers,
      [currentQuestion.id]: updated
    });
    saveAnswerToServer(currentQuestion.id, current.selected_option_id, current.essay_answer, newReview);
  };

  // Auto submit when time expires
  const handleAutoSubmit = async () => {
    if (!attemptId || isSubmitting || isCompleted) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitExam(attemptId);
      setIsCompleted(true);
      setCompletionData(res);
    } catch (err) {
      console.error('Auto submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final Manual Submit
  const handleFinalSubmit = async () => {
    if (!attemptId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitExam(attemptId);
      setIsCompleted(true);
      setCompletionData(res);
      setShowSubmitModal(false);
    } catch (err: any) {
      alert(err.message || 'Gagal mengumpulkan ujian.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#5E35B1]" />
        <div className="text-sm font-semibold text-slate-700">Mempersiapkan Lembar Ujian CBT...</div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Kendala Memulai Ujian</h3>
        <p className="text-xs text-slate-600">{initError}</p>
        <button
          onClick={onExit}
          className="px-5 py-2 text-xs font-bold text-white bg-[#5E35B1] rounded-xl"
        >
          Kembali ke Jadwal Ujian
        </button>
      </div>
    );
  }

  // Completed Screen
  if (isCompleted) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-md text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Ujian Telah Berhasil Dikumpulkan!</h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          Alhamdulillah, seluruh jawaban Anda telah tersimpan secara resmi di server panitia seleksi Pondok Pesantren Al-Ikhlash.
        </p>

        <div className="bg-[#F3EEFF] p-4 rounded-2xl border border-[#B39DDB]/30 text-xs text-slate-700 max-w-sm mx-auto space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Nomor Peserta:</span>
            <span className="font-mono font-bold text-[#5E35B1]">{studentProfile?.registration_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Waktu Pengumpulan:</span>
            <span className="font-semibold">
              {new Date(completionData?.submitted_at || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status Penilaian:</span>
            <span className="font-semibold text-emerald-700">Tersimpan & Diverifikasi</span>
          </div>
        </div>

        <div className="pt-3">
          <button
            onClick={() => {
              onExit();
              navigate('/student/dashboard');
            }}
            className="w-full py-3 px-6 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl shadow-xs transition-colors"
          >
            Kembali ke Dashboard Calon Santri
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  // Stats for questions palette
  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    return a && (a.selected_option_id || (a.essay_answer && a.essay_answer.trim().length > 0));
  }).length;

  const reviewCount = questions.filter((q) => answers[q.id]?.marked_for_review).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Offline Resilience Banner */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-amber-900 shadow-xs">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Koneksi Internet Terputus: </span>
            Lembar ujian tetap aktif dan seluruh pilihan jawaban Anda tersimpan aman secara lokal di peramban ini. Sistem akan otomatis menyinkronkan data ke server panitia saat koneksi internet kembali pulih.
          </div>
        </div>
      )}

      {/* CBT Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold text-[#5E35B1]">CBT Pondok Pesantren Al-Ikhlash</div>
          <h2 className="text-base font-extrabold text-slate-900">Ujian Seleksi Masuk Santri Baru</h2>
          <div className="text-xs text-slate-500 font-mono">Peserta: {studentProfile?.registration_number}</div>
        </div>

        {/* Server Countdown Timer */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold border transition-colors ${
            remainingSeconds < 300
              ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
              : 'bg-[#F3EEFF] text-[#5E35B1] border-[#B39DDB]/40'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Sync & Connectivity status */}
          <div className="hidden sm:flex items-center gap-3 text-xs border-l border-slate-200 pl-4">
            <div className="flex items-center gap-1.5" title={isOnline ? 'Terhubung ke server' : 'Koneksi terputus'}>
              {isOnline ? (
                <Wifi className="w-4 h-4 text-emerald-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-rose-600" />
              )}
              <span className="text-[11px] text-slate-600">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              {saveStatus === 'saving' && <span className="text-amber-600">Menyimpan...</span>}
              {saveStatus === 'saved' && (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Tersimpan
                </span>
              )}
              {saveStatus === 'error' && <span className="text-rose-600">Gagal simpan</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Examination Viewport: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Question & Answer Area */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          {currentQuestion ? (
            <>
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-[#5E35B1] bg-[#F3EEFF] px-2.5 py-1 rounded">
                    Soal No. {currentIndex + 1} dari {questions.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Kategori: <strong>{currentQuestion.category_name}</strong>
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  Bobot: {currentQuestion.points} Poin
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base text-slate-900 leading-relaxed font-medium">
                {currentQuestion.question_text}
              </div>

              {/* Options for Multiple Choice */}
              {currentQuestion.question_type === 'multiple_choice' && (
                <div className="space-y-2.5 pt-2">
                  {currentQuestion.options?.map((opt: any, idx: number) => {
                    const isSelected = currentAnswer?.selected_option_id === opt.id;
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#F3EEFF] border-[#5E35B1] text-[#29243A] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[#5E35B1] text-white border-[#5E35B1]'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {letter}
                        </span>
                        <span className="text-xs sm:text-sm mt-0.5 leading-relaxed">{opt.option_text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Textarea for Essay */}
              {currentQuestion.question_type === 'essay' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tuliskan Jawaban Esai Anda Secara Rinci:
                  </label>
                  <textarea
                    rows={6}
                    value={currentAnswer?.essay_answer || ''}
                    onChange={(e) => handleEssayChange(e.target.value)}
                    onBlur={handleEssayBlur}
                    placeholder="Ketikkan jawaban esai Anda di sini..."
                    className="w-full p-3.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#5E35B1] focus:outline-none"
                  />
                  <div className="text-[11px] text-slate-400">
                    Jawaban disimpan secara otomatis saat Anda beralih soal.
                  </div>
                </div>
              )}

              {/* Navigation & Action Controls */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleReview}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    currentAnswer?.marked_for_review
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>{currentAnswer?.marked_for_review ? 'Ditandai Ragu-ragu' : 'Tandai Ragu-ragu'}</span>
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-lg transition-colors"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kumpulkan Ujian</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">Soal tidak ditemukan.</div>
          )}
        </div>

        {/* Right Column: Question Number Palette */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Navigasi Nomor Soal</h3>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> {answeredCount} Dijawab
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> {reviewCount} Ragu
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-200"></span> {unansweredCount} Belum
              </span>
            </div>
          </div>

          {/* Palette Grid */}
          <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
            {questions.map((q, idx) => {
              const a = answers[q.id];
              const isAnswered = a && (a.selected_option_id || (a.essay_answer && a.essay_answer.trim().length > 0));
              const isReview = a?.marked_for_review;
              const isCurrent = currentIndex === idx;

              let style = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
              if (isReview) {
                style = 'bg-amber-400 text-amber-950 font-bold border-amber-500 shadow-xs';
              } else if (isAnswered) {
                style = 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-xs';
              }

              if (isCurrent) {
                style += ' ring-2 ring-[#5E35B1] ring-offset-1';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-lg text-xs font-mono transition-all border flex items-center justify-center ${style}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Selesai & Kumpulkan Ujian</span>
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="border-b border-slate-100 pb-3 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Pengumpulan Ujian
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pastikan Anda telah meninjau seluruh jawaban sebelum mengumpulkan.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Soal:</span>
                <span className="font-bold text-slate-900">{questions.length} Butir</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Sudah Dijawab:</span>
                <span className="font-bold text-emerald-600">{answeredCount} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Ditandai Ragu-ragu:</span>
                <span className="font-bold text-amber-600">{reviewCount} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Belum Dijawab:</span>
                <span className="font-bold text-rose-600">{unansweredCount} Soal</span>
              </div>
            </div>

            {!isOnline && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Koneksi internet terputus. Harap tunggu hingga online kembali sebelum mengumpulkan ujian agar seluruh jawaban terkirim ke server panitia.</span>
              </div>
            )}

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Setelah dikumpulkan, sesi ujian akan diselesaikan secara permanen dan jawaban tidak dapat diubah kembali.
            </p>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Lanjutkan Mengerjakan
              </button>
              <button
                type="button"
                disabled={isSubmitting || !isOnline}
                onClick={handleFinalSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Mengumpulkan...' : !isOnline ? 'Menunggu Koneksi...' : 'Ya, Kumpulkan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
