"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/components/PageLoader";

interface LogRow {
  id: string;
  user_id: string;
  tool_id: string;
  user_name: string;
  tool_name: string;
  accessed_at: string;
  action: string;
  extension_version?: string | null;
}

/**
 * Usage logs page with filters and CSV export.
 */
export default function LogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [tools, setTools] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [toolId, setToolId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    void Promise.all([loadFilters(), loadLogs()]);
  }, []);

  async function loadFilters() {
    const [usersRes, toolsRes] = await Promise.all([
      supabase.from("users").select("id, name").order("name", { ascending: true }),
      supabase.from("tools").select("id, name").order("name", { ascending: true }),
    ]);
    setUsers(usersRes.data || []);
    setTools(toolsRes.data || []);
  }

  async function loadLogs() {
    setLoading(true);
    const query = new URLSearchParams();
    if (userId) query.set("userId", userId);
    if (toolId) query.set("toolId", toolId);
    if (start) query.set("start", start);
    if (end) query.set("end", end);

    const response = await fetch(`/api/logs?${query.toString()}`);
    const data = await response.json();
    setLogs(data.logs || []);
    setLoading(false);
  }

  async function exportCsv() {
    const query = new URLSearchParams();
    if (userId) query.set("userId", userId);
    if (toolId) query.set("toolId", toolId);
    if (start) query.set("start", start);
    if (end) query.set("end", end);
    query.set("format", "csv");

    const response = await fetch(`/api/logs?${query.toString()}`);
    const csv = await response.text();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "usage_logs.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const hasFilters = useMemo(() => !!(userId || toolId || start || end), [userId, toolId, start, end]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usage Logs</h1>
          <p className="text-gray-500 mt-2">Track who launched what and when</p>
        </div>
        <button 
          onClick={exportCsv} 
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-medium transition-all shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)} 
            className="input-modern"
          >
            <option value="">All users</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select 
            value={toolId} 
            onChange={(e) => setToolId(e.target.value)} 
            className="input-modern"
          >
            <option value="">All resources</option>
            {tools.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input 
            type="date" 
            value={start} 
            onChange={(e) => setStart(e.target.value)} 
            className="input-modern"
            placeholder="Start date"
          />
          <input 
            type="date" 
            value={end} 
            onChange={(e) => setEnd(e.target.value)} 
            className="input-modern"
            placeholder="End date"
          />
          <div className="flex gap-2">
            <button 
              onClick={loadLogs} 
              className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-medium transition-all"
            >
              Apply
            </button>
            {hasFilters && (
              <button 
                onClick={() => { setUserId(""); setToolId(""); setStart(""); setEnd(""); }} 
                className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Resource</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Ext. Version</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-gray-500" colSpan={5}>
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      No logs found
                    </div>
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs">
                        {log.user_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{log.user_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-medium text-gray-700">
                      {log.tool_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(log.accessed_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${log.action === 'launch' ? 'badge-success' : 'badge-info'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{log.extension_version || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
