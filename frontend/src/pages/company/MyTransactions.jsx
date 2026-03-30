import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/shared/Layout';
import { tradingAPI } from '../../services/api';
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function MyTransactions() {
  const { user } = useAuthStore();
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => tradingAPI.getTransactions().then(r => r.data),
  });

  const statusStyle = {
    completed: 'bg-emerald-500/20 text-emerald-400',
    processing: 'bg-blue-500/20 text-blue-400',
    failed: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    cancelled: 'bg-gray-700 text-gray-400',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaction History</h1>
          <p className="text-gray-400 text-sm mt-1">All your buy and sell transactions</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl">
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs text-gray-400 px-6 py-3 font-medium">Type</th>
                  <th className="text-left text-xs text-gray-400 px-6 py-3 font-medium">Counterparty</th>
                  <th className="text-left text-xs text-gray-400 px-6 py-3 font-medium">Credits</th>
                  <th className="text-left text-xs text-gray-400 px-6 py-3 font-medium">Total</th>
                  <th className="text-left text-xs text-gray-400 px-6 py-3 font-medium">Status</th>
                  <th className="text-left text-xs text-gray-400 px-6 py-3 font-medium">Blockchain</th>
                  <th className="text-left text-xs text-gray-400 px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isSell = tx.seller_name === user?.company_name;
                  return (
                    <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 text-sm ${isSell ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {isSell ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                          {isSell ? 'Sold' : 'Bought'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {isSell ? tx.buyer_name : tx.seller_name}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-white">{tx.credits_amount}</td>
                      <td className="px-6 py-4 text-sm text-emerald-400 font-medium">${tx.total_price}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusStyle[tx.status] || 'bg-gray-700 text-gray-300'}`}>
                          {tx.status_display}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tx.blockchain_tx_hash ? (
                          <span className="text-xs text-blue-400 font-mono flex items-center gap-1">
                            {tx.blockchain_tx_hash.slice(0, 10)}...
                            <ExternalLink size={10} />
                          </span>
                        ) : <span className="text-xs text-gray-600">—</span>}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
