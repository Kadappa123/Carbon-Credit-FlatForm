import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/shared/Layout';
import { governmentAPI } from '../../services/api';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function FraudAlerts() {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['fraud-alerts'],
    queryFn: () => governmentAPI.getFraudAlerts().then(r => r.data.results || r.data),
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <ShieldAlert size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Fraud Alerts</h1>
            <p className="text-gray-400 text-sm">Submissions flagged by the AI verification engine</p>
          </div>
          {alerts.length > 0 && (
            <span className="ml-auto bg-red-500/20 text-red-400 text-sm px-3 py-1 rounded-full border border-red-500/20">
              {alerts.length} alerts
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl">
            <AlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
            <p>No fraud alerts</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-gray-900 border border-red-500/30 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-400" />
                    <div>
                      <p className="font-semibold text-white">{alert.company_name}</p>
                      <p className="text-sm text-gray-400">{alert.submission_period}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">Fraud Flagged</span>
                    <p className="text-xs text-gray-500 mt-1">{new Date(alert.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-gray-800 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400">Reported CO₂</p>
                    <p className="text-sm font-bold text-white">{alert.total_co2_emissions} t</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400">AI Estimated</p>
                    <p className="text-sm font-bold text-yellow-400">{alert.ai_verified_emissions?.toFixed(1) || '—'} t</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400">Confidence</p>
                    <p className="text-sm font-bold text-red-400">{((alert.ai_confidence_score || 0) * 100).toFixed(0)}%</p>
                  </div>
                </div>
                {alert.ai_notes && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-400 mb-1">AI Notes:</p>
                    <p className="text-xs text-red-300 whitespace-pre-line">{alert.ai_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
