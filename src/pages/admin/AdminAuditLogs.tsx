import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { History, Shield, Calendar, User } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs()
      .then(setLogs)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Audit Log & Rekam Jejak Keamanan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan otomatis seluruh operasi sensitif, perubahan status verifikasi, dan penilaian ujian.
          </p>
        </div>

        <div className="text-xs font-mono font-bold text-[#5E35B1] bg-[#F3EEFF] px-3 py-1.5 rounded-lg border border-[#B39DDB]/30">
          {logs.length} Rekam Log
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Memuat audit log...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">Belum ada aktivitas tercatat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Waktu (WIB)</th>
                  <th className="py-3 px-4 font-semibold">Pelaku (Aktor)</th>
                  <th className="py-3 px-4 font-semibold">Tindakan (Action)</th>
                  <th className="py-3 px-4 font-semibold">Entitas</th>
                  <th className="py-3 px-4 font-semibold">Rincian Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{log.actor_name || 'Sistem Otomatis'}</div>
                      <div className="text-[10px] font-mono text-slate-400">{log.actor_id || 'SYSTEM'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-bold text-[#5E35B1] bg-[#F3EEFF] px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {log.entity_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
