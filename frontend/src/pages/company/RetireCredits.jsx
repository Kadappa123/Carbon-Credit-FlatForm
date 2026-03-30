import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/shared/Layout';
import { tradingAPI, companiesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Flame, Award, CheckCircle } from 'lucide-react';

export default function RetireCredits() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ credits_amount: '', retirement_reason: '', offset_description: '' });
  const [certificate, setCertificate] = useState(null);

  const { data: company } = useQuery({
    queryKey: ['company-profile'],
    queryFn: () => companiesAPI.getProfile().then(r => r.data),
  });

  const { data: retirements = [] } = useQuery({
    queryKey: ['retirements'],
    queryFn: () => tradingAPI.getRetirements().then(r => r.data),
  });

  const retireMutation = useMutation({
    mutationFn: (data) => tradingAPI.retireCredits(data),
    onSuccess: (res) => {
      toast.success('Credits retired and certificate generated!');
      setCertificate(res.data);
      qc.invalidateQueries(['retirements']);
      qc.invalidateQueries(['company-profile']);
      setForm({ credits_amount: '', retirement_reason: '', offset_description: '' });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Retirement failed'),
  });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Retire Carbon Credits</h1>
          <p className="text-gray-400 text-sm mt-1">Permanently burn credits to offset your emissions and receive a certificate.</p>
        </div>

        {/* Balance */}
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Available Balance</p>
            <p className="text-4xl font-black text-white mt-1">{company?.credit_balance || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Carbon Credits</p>
          </div>
          <Flame size={48} className="text-orange-400/40" />
        </div>

        {/* Retire Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Retire Credits</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Credits to Retire *</label>
              <input
                type="number" min="1" max={company?.credit_balance || 0}
                value={form.credits_amount}
                onChange={e => setForm({ ...form, credits_amount: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Retirement Reason *</label>
              <input
                type="text"
                value={form.retirement_reason}
                onChange={e => setForm({ ...form, retirement_reason: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                placeholder="e.g. Annual emission offset for 2024"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Offset Description</label>
              <textarea
                value={form.offset_description}
                onChange={e => setForm({ ...form, offset_description: e.target.value })}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 resize-none"
                placeholder="Describe how these credits offset your emissions..."
              />
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs text-red-400">⚠️ This action is irreversible. Retired credits are permanently burned from the blockchain.</p>
            </div>
            <button
              onClick={() => retireMutation.mutate(form)}
              disabled={retireMutation.isPending || !form.credits_amount || !form.retirement_reason}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Flame size={16} />
              {retireMutation.isPending ? 'Retiring...' : 'Retire Credits'}
            </button>
          </div>
        </div>

        {/* Certificate display */}
        {certificate && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} className="text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Certificate Generated!</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Certificate #</span>
                <span className="text-emerald-400 font-mono font-bold">{certificate.certificate_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Credits Retired</span>
                <span className="text-white font-semibold">{certificate.retired_credit?.credits_retired}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Blockchain TX</span>
                <span className="text-blue-400 font-mono text-xs">{certificate.retired_credit?.blockchain_tx_hash?.slice(0, 20)}...</span>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {retirements.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Award size={16} className="text-yellow-400" /> Retirement History
            </h2>
            <div className="space-y-3">
              {retirements.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">{r.certificate_number}</p>
                    <p className="text-xs text-gray-400">{r.retirement_reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-400">{r.credits_retired} credits</p>
                    <p className="text-xs text-gray-500">{new Date(r.retired_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
