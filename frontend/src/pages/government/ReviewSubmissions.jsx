import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/shared/Layout';
import { governmentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function ReviewSubmissions() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [reviewForms, setReviewForms] = useState({});

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['gov-submissions'],
    queryFn: () => governmentAPI.getSubmissions({ status: 'ai_verified' }).then(r => r.data.results || r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }) => governmentAPI.reviewSubmission(id, data),
    onSuccess: (_, vars) => {
      toast.success(`Submission ${vars.data.action === 'approve' ? 'approved' : 'rejected'}!`);
      qc.invalidateQueries(['gov-submissions']);
      qc.invalidateQueries(['gov-dashboard']);
      setExpanded(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Review failed'),
  });

  const updateForm = (id, field, value) =>
    setReviewForms(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const getForm = (id) => reviewForms[id] || {};

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Emission Submissions</h1>
          <p className="text-gray-400 text-sm mt-1">AI-verified submissions awaiting government approval</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl">
            <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p>No submissions pending review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
                >
                  <div className="flex items-center gap-4">
                    {sub.ai_fraud_flag && (
                      <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-white">{sub.company_name}</p>
                      <p className="text-sm text-gray-400">{sub.submission_period} · {sub.total_co2_emissions} t CO₂</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-gray-400">AI Confidence</p>
                      <p className={`text-sm font-bold ${(sub.ai_confidence_score || 0) >= 0.75 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {((sub.ai_confidence_score || 0) * 100).toFixed(0)}%
                      </p>
                    </div>
                    {sub.ai_fraud_flag
                      ? <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">⚠ Fraud Alert</span>
                      : <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">AI Verified</span>
                    }
                    {expanded === sub.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === sub.id && (
                  <div className="px-5 pb-5 border-t border-gray-800 pt-4 space-y-4">
                    {/* AI Notes */}
                    {sub.ai_notes && (
                      <div className={`p-3 rounded-lg text-sm ${sub.ai_fraud_flag ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-blue-500/10 border border-blue-500/20 text-blue-300'}`}>
                        <p className="font-medium mb-1">AI Analysis:</p>
                        <p className="whitespace-pre-line">{sub.ai_notes}</p>
                      </div>
                    )}

                    {/* Data grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Reported CO₂', value: `${sub.total_co2_emissions} t` },
                        { label: 'AI Estimated', value: sub.ai_verified_emissions ? `${sub.ai_verified_emissions?.toFixed(1)} t` : '—' },
                        { label: 'Energy (MWh)', value: sub.energy_consumption || '—' },
                        { label: 'Renewables', value: `${sub.renewable_energy_percentage || 0}%` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400">{label}</p>
                          <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Review form */}
                    <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-300">Government Decision</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Assign Credits</label>
                          <input type="number" min="0"
                            value={getForm(sub.id).assigned_credits || ''}
                            onChange={e => updateForm(sub.id, 'assigned_credits', e.target.value)}
                            placeholder="e.g. 25"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Assign Score (0-100)</label>
                          <input type="number" min="0" max="100"
                            value={getForm(sub.id).assigned_score || ''}
                            onChange={e => updateForm(sub.id, 'assigned_score', e.target.value)}
                            placeholder="e.g. 75"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
                        <textarea
                          value={getForm(sub.id).notes || ''}
                          onChange={e => updateForm(sub.id, 'notes', e.target.value)}
                          rows={2}
                          placeholder="Add review notes..."
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => reviewMutation.mutate({ id: sub.id, data: { action: 'approve', ...getForm(sub.id) } })}
                          disabled={reviewMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          onClick={() => reviewMutation.mutate({ id: sub.id, data: { action: 'reject', notes: getForm(sub.id).notes } })}
                          disabled={reviewMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 py-2.5 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
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
