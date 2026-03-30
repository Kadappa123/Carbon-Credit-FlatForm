import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/shared/Layout';
import { governmentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Building2, Search } from 'lucide-react';

export default function ManageCompanies() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ status: 'approved', emission_limit: '', notes: '' });

  const { data: dashData } = useQuery({
    queryKey: ['gov-dashboard'],
    queryFn: () => governmentAPI.getDashboard().then(r => r.data),
  });

  const kybMutation = useMutation({
    mutationFn: ({ id, data }) => governmentAPI.reviewKYB(id, data),
    onSuccess: () => {
      toast.success('Company status updated!');
      qc.invalidateQueries(['gov-dashboard']);
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Update failed'),
  });

  const limitMutation = useMutation({
    mutationFn: ({ id, data }) => governmentAPI.setEmissionLimit(id, data),
    onSuccess: () => { toast.success('Emission limit set!'); setModal(null); },
    onError: () => toast.error('Failed to set limit'),
  });

  const allCompanies = [
    ...(dashData?.pending_companies || []),
  ];

  const statusStyle = {
    approved: 'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    rejected: 'bg-red-500/20 text-red-400',
    suspended: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Companies</h1>
          <p className="text-gray-400 text-sm mt-1">Review KYB applications and set emission limits</p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {allCompanies.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Building2 size={32} className="mx-auto mb-3 opacity-30" />
              <p>No pending companies</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Company', 'Industry', 'Country', 'Status', 'Score', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-400 px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allCompanies.filter(c => c.name?.toLowerCase().includes(search.toLowerCase())).map(c => (
                  <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.registration_number}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-300 capitalize">{c.industry}</td>
                    <td className="px-5 py-4 text-sm text-gray-300">{c.country}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusStyle[c.status] || ''}`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-white">{c.carbon_credit_score?.toFixed(1) || '—'}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => { setModal(c); setForm({ status: 'approved', emission_limit: '', notes: '' }); }}
                        className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1.5 rounded-lg transition-colors">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* KYB Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Review: {modal.name}</h3>
            <div className="bg-gray-800 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Reg. Number</span><span className="text-white">{modal.registration_number}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Industry</span><span className="text-white capitalize">{modal.industry}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Country</span><span className="text-white">{modal.country}</span></div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Decision</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
                <option value="suspended">Suspend</option>
              </select>
            </div>
            {form.status === 'approved' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Annual Emission Limit (tons CO₂)</label>
                <input type="number" value={form.emission_limit} onChange={e => setForm({ ...form, emission_limit: e.target.value })}
                  placeholder="e.g. 1000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm font-medium">Cancel</button>
              <button
                onClick={() => kybMutation.mutate({ id: modal.id, data: form })}
                disabled={kybMutation.isPending}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${form.status === 'approved' ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-red-500 hover:bg-red-400 text-white'}`}>
                {kybMutation.isPending ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
