import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import { companiesAPI } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Leaf, TrendingUp, ArrowLeftRight, Flame, Plus, AlertCircle } from 'lucide-react';

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'emerald' : score >= 50 ? 'yellow' : score >= 20 ? 'orange' : 'red';
  const label = score >= 80 ? 'Excellent' : score >= 50 ? 'Balanced' : score >= 20 ? 'Needs Work' : 'Critical';
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-${color}-500/20 text-${color}-400`}>
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'emerald' }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-${color}-500/10`}>
          <Icon size={20} className={`text-${color}-400`} />
        </div>
      </div>
    </div>
  );
}

export default function CompanyDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => companiesAPI.getEmissionDashboard().then(r => r.data),
  });

  if (isLoading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    </Layout>
  );

  const company = data?.company;
  const score = company?.carbon_credit_score || 0;

  const chartData = [
    { name: 'Credits', value: company?.credit_balance || 0, fill: '#10b981' },
    { name: 'Traded Today', value: company?.credits_traded_today || 0, fill: '#f59e0b' },
    { name: 'Daily Limit', value: company?.daily_trading_limit || 50, fill: '#6366f1' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{company?.name || 'Company Dashboard'}</h1>
            <p className="text-gray-400 text-sm mt-1">{company?.industry} · {company?.country}</p>
          </div>
          <Link to="/company/emissions/submit"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Submit Emissions
          </Link>
        </div>

        {/* Score banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Carbon Credit Score</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-5xl font-black text-white">{score.toFixed(1)}</span>
                <span className="text-2xl text-gray-500">/100</span>
                <ScoreBadge score={score} />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {score >= 80
                  ? '✅ You are eligible to sell credits on the marketplace.'
                  : score >= 50
                  ? '⚠️ Keep reducing emissions to qualify as a seller.'
                  : '❌ You must purchase credits to offset your emissions.'}
              </p>
            </div>
            {/* Score gauge */}
            <div className="w-32 h-32 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${(score / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white rotate-0">
                {score.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Leaf} label="Credit Balance" value={company?.credit_balance || 0} sub="Available tokens" />
          <StatCard icon={TrendingUp} label="ESG Score" value={(company?.esg_score || 0).toFixed(1)} sub="Sustainability" color="blue" />
          <StatCard icon={ArrowLeftRight} label="Traded Today" value={company?.credits_traded_today || 0} sub={`Limit: ${company?.daily_trading_limit || 50}/day`} color="yellow" />
          <StatCard icon={Flame} label="Submissions" value={data?.total_submissions || 0} sub={`${data?.approved_submissions || 0} approved`} color="orange" />
        </div>

        {/* Chart + Recent submissions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Credit Overview</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Recent Submissions</h3>
            {data?.recent_submissions?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <AlertCircle size={24} className="mb-2" />
                <p className="text-sm">No submissions yet</p>
                <Link to="/company/emissions/submit" className="text-emerald-400 text-sm mt-1 hover:underline">
                  Submit your first report →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.recent_submissions?.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{sub.submission_period}</p>
                      <p className="text-xs text-gray-400">{sub.total_co2_emissions} tons CO₂</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.ai_fraud_flag && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">⚠ Flagged</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sub.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        sub.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        sub.status === 'ai_verified' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {sub.status_display}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
