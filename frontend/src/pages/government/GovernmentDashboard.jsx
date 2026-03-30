import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import { governmentAPI } from '../../services/api';
import { Building2, FileSearch, AlertTriangle, Activity, ArrowRight } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, to }) {
  const card = (
    <div className={`bg-gray-900 border border-gray-800 hover:border-${color}-500/30 rounded-xl p-5 transition-colors`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-500/10`}>
          <Icon size={20} className={`text-${color}-400`} />
        </div>
      </div>
      {to && <p className={`text-xs text-${color}-400 mt-3 flex items-center gap-1`}>View all <ArrowRight size={10} /></p>}
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

export default function GovernmentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['gov-dashboard'],
    queryFn: () => governmentAPI.getDashboard().then(r => r.data),
  });

  const s = data?.summary || {};

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Government Authority Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Platform oversight and regulatory control</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Building2} label="Total Companies" value={s.total_companies || 0} color="blue" to="/gov/companies" />
              <StatCard icon={Building2} label="Pending KYB" value={s.pending_kyb || 0} color="yellow" to="/gov/companies" />
              <StatCard icon={FileSearch} label="Pending Reviews" value={s.pending_review || 0} color="purple" to="/gov/submissions" />
              <StatCard icon={AlertTriangle} label="Fraud Alerts" value={s.fraud_alerts || 0} color="red" to="/gov/fraud" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-sm text-gray-400">Total Emissions Tracked</p>
                <p className="text-2xl font-bold text-white mt-1">{s.total_emissions_tracked?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500 mt-1">tons CO₂ verified</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-sm text-gray-400">Approved Companies</p>
                <p className="text-2xl font-bold text-white mt-1">{s.approved_companies || 0}</p>
                <p className="text-xs text-gray-500 mt-1">active on platform</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-sm text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-white mt-1">{s.total_transactions || 0}</p>
                <p className="text-xs text-gray-500 mt-1">on blockchain</p>
              </div>
            </div>

            {/* Pending items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-300">Submissions Awaiting Review</h3>
                  <Link to="/gov/submissions" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
                </div>
                {data?.recent_submissions?.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No pending submissions</p>
                ) : (
                  <div className="space-y-3">
                    {data?.recent_submissions?.slice(0, 5).map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-white">{sub.company_name}</p>
                          <p className="text-xs text-gray-400">{sub.submission_period} · {sub.total_co2_emissions} t CO₂</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.ai_fraud_flag && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">⚠ Alert</span>}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">AI Verified</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-300">Companies Pending KYB</h3>
                  <Link to="/gov/companies" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
                </div>
                {data?.pending_companies?.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No pending KYB requests</p>
                ) : (
                  <div className="space-y-3">
                    {data?.pending_companies?.slice(0, 5).map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-white">{c.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{c.industry} · {c.country}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Pending</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
