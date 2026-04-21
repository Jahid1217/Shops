import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'motion/react';

export default function AuditLogs() {
  const { hasMenu, hasFeature } = useAuth();
  const canViewAudit = hasMenu('audit-logs') && hasFeature('audit.view');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canViewAudit) {
      fetchLogs();
    } else {
      setLoading(false);
    }
  }, [canViewAudit]);

  const fetchLogs = async () => {
    try {
      const data = await api.get<any[]>('/audit-logs');
      setLogs(data);
    } catch (error) {
      console.error("Error fetching audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  if (!canViewAudit) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-6">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 mb-2">Access Denied</h2>
        <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Security & Audit logs are restricted to administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Audit Logs</h1>
          <p className="text-neutral-500 font-medium mt-1">System-wide activity tracking for security and accountability.</p>
        </div>
        <div className="px-5 py-3 rounded-2xl bg-neutral-100 flex items-center font-bold text-neutral-500 shadow-inner">
          <Activity size={18} className="mr-2" />
          Live Monitoring Active
        </div>
      </header>

      {/* Logs View */}
      <div className="bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm overflow-hidden">
        <div className="p-6 bg-neutral-50/50 border-b border-neutral-100">
          <h2 className="text-sm font-black uppercase tracking-widest text-neutral-900">Recent Activity</h2>
        </div>
        
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-neutral-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="text-sm font-bold uppercase tracking-widest">Loading Logs...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-neutral-50">
            {logs.map((log, i) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="p-6 hover:bg-neutral-50/50 transition-colors flex flex-col md:flex-row md:items-start gap-4 md:gap-8 group"
              >
                <div className="shrink-0 w-32">
                  <p className="text-xs font-bold text-neutral-900">{new Date(log.timestamp).toLocaleDateString()}</p>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 justify-between">
                     <span className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-neutral-200 box-shadow-sm">
                       {log.action}
                     </span>
                     <span className="text-xs font-bold text-neutral-500 bg-white px-2 py-1 rounded shadow-sm border border-neutral-100">
                       {log.userName}
                     </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-700 mt-3 leading-relaxed">
                    {log.details}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-neutral-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-neutral-100">
              <Activity size={24} className="text-neutral-300" />
            </div>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-[0.2em]">No activity logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
