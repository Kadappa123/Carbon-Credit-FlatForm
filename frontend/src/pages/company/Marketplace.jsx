import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/shared/Layout';
import { tradingAPI, companiesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Star, Building2, Globe, Search, Plus } from 'lucide-react';

export default function Marketplace() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [buyModal, setBuyModal] = useState(null);
  const [amount, setAmount] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [listingForm, setListingForm] = useState({ credits_available:'', price_per_credit:'', description:'' });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['marketplace'],
    queryFn: () => tradingAPI.getMarketplace().then(r => {
      const d = r.data;
      if (Array.isArray(d)) return d;
      if (d?.results) return d.results;
      return [];4
    }),
  });

  const { data: company } = useQuery({
    queryKey: ['company-profile'],
    queryFn: () => companiesAPI.getProfile().then(r => r.data).catch(() => null),
  });

  const purchaseMutation = useMutation({
    mutationFn: (data) => tradingAPI.purchaseCredits(data),
    onSuccess: (res) => {
      toast.success(`Purchase successful! TX: ${res.data.blockchain_tx_hash?.slice(0,14)}...`);
      qc.invalidateQueries(['marketplace']);
      qc.invalidateQueries(['dashboard']);
      qc.invalidateQueries(['company-profile']);
      setBuyModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Purchase failed'),
  });

  const createListingMutation = useMutation({
    mutationFn: (data) => tradingAPI.createListing(data),
    onSuccess: () => {
      toast.success('Listing created!');
      qc.invalidateQueries(['marketplace']);
      setShowCreate(false);
      setListingForm({ credits_available:'', price_per_credit:'', description:'' });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create listing'),
  });

  const filtered = listings.filter(l =>
    (l.company_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (l.company_industry||'').toLowerCase().includes(search.toLowerCase())
  );

  const scoreColor = (score) =>
    score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';

  const canSell = company?.carbon_credit_score >= 80 && company?.status === 'approved';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Carbon Credit Marketplace</h1>
            <p className="text-gray-400 text-sm mt-1">Purchase credits from verified high-score companies</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/10 text-emerald-400 text-sm px-3 py-1 rounded-full border border-emerald-500/20">
              {listings.length} listings active
            </span>
            {canSell && (
              <button onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Plus size={14}/> Create Listing
              </button>
            )}
          </div>
        </div>

        {/* Create Listing Form */}
        {showCreate && (
          <div className="bg-gray-900 border border-emerald-500/30 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-emerald-400 mb-4">Create New Listing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Credits Available</label>
                <input type="number" min="1" max={company?.credit_balance}
                  value={listingForm.credits_available}
                  onChange={e=>setListingForm({...listingForm,credits_available:e.target.value})}
                  placeholder={`Max: ${company?.credit_balance||0}`}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"/>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Price per Credit ($)</label>
                <input type="number" min="1"
                  value={listingForm.price_per_credit}
                  onChange={e=>setListingForm({...listingForm,price_per_credit:e.target.value})}
                  placeholder="e.g. 10"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"/>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <input type="text"
                  value={listingForm.description}
                  onChange={e=>setListingForm({...listingForm,description:e.target.value})}
                  placeholder="Clean energy credits"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"/>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={()=>setShowCreate(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
              <button onClick={()=>createListingMutation.mutate(listingForm)}
                disabled={createListingMutation.isPending||!listingForm.credits_available||!listingForm.price_per_credit}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                {createListingMutation.isPending?'Creating...':'Create Listing'}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by company or industry..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"/>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl">
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-30"/>
            <p className="mb-2">No listings available</p>
            {canSell && (
              <button onClick={()=>setShowCreate(true)} className="text-emerald-400 text-sm hover:underline">
                Create the first listing →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((listing) => (
              <div key={listing.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Building2 size={18} className="text-emerald-400"/>
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{listing.company_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{listing.company_industry}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} className={scoreColor(listing.company_score)} fill="currentColor"/>
                    <span className={`text-sm font-bold ${scoreColor(listing.company_score)}`}>
                      {listing.company_score?.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Available</span>
                    <span className="text-white font-semibold">{listing.credits_available} credits</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price/credit</span>
                    <span className="text-emerald-400 font-semibold">${listing.price_per_credit}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Globe size={12}/>{listing.company_country}
                  </div>
                </div>
                <button onClick={()=>{setBuyModal(listing);setAmount(1);}}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <ShoppingCart size={14}/> Buy Credits
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {buyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-1">Purchase Credits</h3>
            <p className="text-sm text-gray-400 mb-6">From: <span className="text-white">{buyModal.company_name}</span></p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Credits to Purchase</label>
                <input type="number" min="1" max={buyModal.credits_available}
                  value={amount} onChange={e=>setAmount(parseInt(e.target.value)||1)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"/>
                <p className="text-xs text-gray-500 mt-1">Max available: {buyModal.credits_available}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price per credit</span>
                  <span className="text-white">${buyModal.price_per_credit}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-700 pt-2 mt-2">
                  <span className="text-gray-300">Total</span>
                  <span className="text-emerald-400">${(amount*parseFloat(buyModal.price_per_credit)).toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-400">⚠️ One-time purchase rule applies. You can only buy from each seller once.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setBuyModal(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={()=>purchaseMutation.mutate({listing_id:buyModal.id,credits_amount:amount})}
                disabled={purchaseMutation.isPending}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {purchaseMutation.isPending?'Processing...':'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}