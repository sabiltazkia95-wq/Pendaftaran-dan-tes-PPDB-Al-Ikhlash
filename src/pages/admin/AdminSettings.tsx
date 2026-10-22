import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      setSuccess('Pengaturan sistem PPDB berhasil disimpan.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan.');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-500">Memuat pengaturan...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pengaturan Sistem PPDB</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas lembaga, tahun ajaran 2027/2028, dan standar kelulusan.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {settings && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lembaga Pesantren</label>
              <input
                type="text"
                value={settings.pesantren_name}
                onChange={(e) => setSettings({ ...settings, pesantren_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
              <input
                type="text"
                value={settings.academic_year}
                onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lembaga Pesantren</label>
            <input
              type="text"
              value={settings.pesantren_address}
              onChange={(e) => setSettings({ ...settings, pesantren_address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Standar Kelulusan (Passing Grade)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.passing_grade}
                onChange={(e) => setSettings({ ...settings, passing_grade: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hotline WhatsApp</label>
              <input
                type="text"
                value={settings.whatsapp_center}
                onChange={(e) => setSettings({ ...settings, whatsapp_center: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Layanan</label>
              <input
                type="email"
                value={settings.email_center}
                onChange={(e) => setSettings({ ...settings, email_center: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
