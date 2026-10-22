import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { ShieldCheck, ShieldAlert, Play, CheckCircle2, XCircle, RefreshCw, Lock, Database } from 'lucide-react';

export const AdminSecurityTests: React.FC = () => {
  const [suiteResult, setSuiteResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  const executeAudit = async () => {
    setLoading(true);
    try {
      const data = await api.runSecurityTests();
      setSuiteResult(data);
    } catch (err: any) {
      alert(err.message || 'Gagal menjalankan audit keamanan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeAudit();
  }, []);

  const categories = [
    { key: 'all', label: 'Semua Uji Keamanan' },
    { key: 'CBT_LIFECYCLE', label: 'Siklus Ujian CBT' },
    { key: 'REGISTRATION', label: 'Registrasi & Role' },
    { key: 'RLS_DATA', label: 'Isolasi RLS Data' },
    { key: 'RBAC_ACCESS', label: 'Wewenang RBAC' },
    { key: 'CBT_INTEGRITY', label: 'Integritas CBT' },
    { key: 'AUTH_SECURITY', label: 'Autentikasi' },
  ];

  const filteredTests = suiteResult?.results?.filter((t: any) =>
    activeTab === 'all' ? true : t.category === activeTab
  ) || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Audit Keamanan Sistem, Role & Row Level Security (RLS)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengujian otomatis terhadap pencegahan kebocoran data antar-santri, isolasi hak akses, dan integritas ujian CBT.
          </p>
        </div>

        <button
          onClick={executeAudit}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl shadow-xs transition-colors disabled:opacity-60"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{loading ? 'Menjalankan Audit...' : 'Jalankan Ulang Audit Keamanan'}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      {suiteResult && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Total Aturan Diuji</div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">{suiteResult.total} Aturan</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
            <div className="text-[11px] font-medium text-emerald-700">Lolos Audit (Passed)</div>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5" />
              <span>{suiteResult.passed}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Pelanggaran / Kebocoran</div>
            <div className={`text-2xl font-black font-mono mt-1 ${suiteResult.failed > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {suiteResult.failed}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Waktu Eksekusi</div>
            <div className="text-2xl font-black font-mono text-[#5E35B1] mt-1">
              {suiteResult.duration_ms} ms
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-xs overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === cat.key
                ? 'bg-[#5E35B1] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Test Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">
            Sedang mengeksekusi suite uji penetrasi dan audit RLS...
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">Tidak ada pengujian pada kategori ini.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTests.map((test: any) => (
              <div key={test.id} className="p-5 hover:bg-slate-50/60 transition-colors space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {test.id}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{test.name}</h4>
                    <span className="text-[10px] font-semibold text-[#5E35B1] bg-[#F3EEFF] px-2 py-0.5 rounded">
                      {test.category}
                    </span>
                  </div>

                  <div>
                    {test.passed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        AMAN (PASSED)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        GAGAL (FAILED)
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{test.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Perilaku yang Diharapkan:</span>
                    <span className="text-slate-800 font-medium">{test.expected}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Hasil Pengujian Aktual:</span>
                    <span className="text-slate-800 font-medium font-mono">{test.actual}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
