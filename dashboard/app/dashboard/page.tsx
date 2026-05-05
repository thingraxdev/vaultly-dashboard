"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";

/**
 * Dashboard overview page
 * Displays statistics and recent activity with beautiful cards
 */
export default function DashboardPage() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsersToday: 0, totalLaunchesToday: 0, totalTools: 0 });
  const [launchesPerTool, setLaunchesPerTool] = useState<Array<{ toolId: string; toolName: string; launches: number }>>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{ id: string; userName: string; toolName: string; accessed_at: string; action: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard-stats");
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Failed to load stats");
        setStats(data.metrics);
        setLaunchesPerTool(data.launchesPerTool || []);
        setRecentActivity(data.recentActivity || []);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "from-blue-500 to-blue-600" },
    { label: "Active Today", value: stats.activeUsersToday, icon: "⚡", color: "from-green-500 to-green-600" },
    { label: "Launches Today", value: stats.totalLaunchesToday, icon: "🚀", color: "from-purple-500 to-purple-600" },
    { label: "Total Resources", value: stats.totalTools, icon: "📦", color: "from-orange-500 to-orange-600" },
  ];

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="animate-slide-up">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Stats Overview</h1>
        <p className="text-gray-500 mt-2">Live access activity across users and resources</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-card p-6 card-hover border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Launches Chart */}
        <div className="bg-white rounded-2xl shadow-card p-6 lg:col-span-2 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Launches Per Resource</h2>
              <p className="text-sm text-gray-500">Last 7 days activity</p>
            </div>
            <div className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
              Live Data
            </div>
          </div>
          
          {launchesPerTool.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">No launches recorded in the last 7 days</p>
            </div>
          ) : (
            <div className="space-y-4">
              {launchesPerTool.map((item) => {
                const max = Math.max(...launchesPerTool.map((x) => x.launches), 1);
                const widthPercent = Math.max(8, Math.round((item.launches / max) * 100));
                return (
                  <div key={item.toolId} className="group">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 font-medium">{item.toolName}</span>
                      <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-xs">
                        {item.launches} launches
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 group-hover:from-primary-600 group-hover:to-primary-700"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-500">Latest events</p>
            </div>
            <Link
              href="/dashboard/logs"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No launch events yet</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((event) => (
                <li
                  key={event.id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs">
                      {event.userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{event.userName}</span>
                        <span className="text-gray-500"> used </span>
                        <span className="font-semibold text-primary-600">{event.toolName}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span>{new Date(event.accessed_at).toLocaleString()}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="capitalize">{event.action}</span>
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
