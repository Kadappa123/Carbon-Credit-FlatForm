
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/shared/Layout';
import { companiesAPI, blockchainAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Building2, Wallet, ShieldCheck, Edit2, Save, Plus } from 'lucide-react';

export default function CompanyProfile() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [regForm, setRegForm] = useState({ name:'', registration_number:'', industry:'manufacturing', country:'', address:'', website:'' });

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-profile'],
    queryFn: () => companiesAPI.getProfile().then(r => { setForm(r.data); return r.data; }).catch(() => null),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => companiesAPI.updateProfile(data),
    onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries(['company-profile']); setEditing(false); },
    onError: () => toast.error('Update failed'),
  });

  const registerMutation = useMutation({
    mutationFn: (data) => companiesAPI.registerCompany(data),
    onSuccess: () => { toast.success('Company registered! Awaiting government approval.'); qc.invalidateQueries(['company-profile']); },
    onError: (err) => {
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        Object.entries(errors).forEach(([k,v]) => toast.error(`${k}: ${Array.isArray(v)?v[0]:v}`));
      } else { toast.error('Registration failed'); }
    }
  });

  const walletMutation = useMutation({
    mutationFn: () => blockchainAPI.createWallet(),
    onSuccess: (res) => { toast.success('Wallet created!'); alert(`SAVE THIS PRIVATE KEY:\n${res.data.private_key}`); qc.invalidateQueries(['company-profile']); },
    onError: (err) => toast.error(err.response?.data?.error || 'Wallet creation failed'),
  });

  const fmt = (val, suffix='') => val != null ? `${val}${suffix}` : '—';

  if (isLoading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"/></div></Layout>;

  const statusColor = { approved:'emerald', pending:'yellow', rejected:'red', suspended:'orange' };
  const color = statusColor[company?.status] || 'gray';

  if (!company || !company.name) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-white">Company Profile</h1>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-yellow-400 text-sm">No company registered yet. Fill in the details below.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2"><Plus size={16}/>Register Your Company</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {label:'Company Name *', key:'name', placeholder:'Steel Corp'},
                {label:'Registration Number *', key:'registration_number', placeholder:'REG001'},
                {label:'Country *', key:'country', placeholder:'India'},
                {label:'Website', key:'website', placeholder:'https://example.com'},
              ].map(({label,key,placeholder}) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input value={regForm[key]||''} placeholder={placeholder}
                    onChange={e=>setRegForm({...regForm,[key]:e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"/>
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Industry *</label>
                <select value={regForm.industry} onChange={e=>setRegForm({...regForm,industry:e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                  {['manufacturing','energy','transport','agriculture','construction','chemical','mining','tech','other'].map(i=>(
                    <option key={i} value={i}>{i.charAt(0).toUpperCase()+i.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs text-gray-400 mb-1">Address *</label>
              <textarea value={regForm.address||''} onChange={e=>setRegForm({...regForm,address:e.target.value})}
                rows={2} placeholder="123 Main St, Bangalore, India"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"/>
            </div>
            <button onClick={()=>registerMutation.mutate(regForm)}
              disabled={registerMutation.isPending||!regForm.name||!regForm.registration_number||!regForm.country||!regForm.address}
              className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
              {registerMutation.isPending?'Registering...':'Register Company'}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Company Profile</h1>
          <button onClick={()=>editing?updateMutation.mutate(form):setEditing(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {editing?<><Save size={14}/>Save</>:<><Edit2 size={14}/>Edit</>}
          </button>
        </div>

        <div className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4 flex items-center gap-3`}>
          <ShieldCheck size={20} className={`text-${color}-400`}/>
          <div>
            <p className={`text-sm font-semibold text-${color}-400 capitalize`}>{company?.status}</p>
            <p className="text-xs text-gray-400">
              {company?.status==='approved'?'Your company is verified and active.':
               company?.status==='pending'?'Awaiting government KYB review.':
               'Contact government authority for details.'}
            </p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-blue-400"/>Company Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {label:'Company Name', key:'name'},
              {label:'Registration Number', key:'registration_number', readonly:true},
              {label:'Industry', key:'industry'},
              {label:'Country', key:'country'},
              {label:'Website', key:'website'},
            ].map(({label,key,readonly})=>(
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                {editing&&!readonly?(
                  <input value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"/>
                ):(
                  <p className="text-sm text-white">{company?.[key]||'—'}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-1">Address</label>
            {editing?(
              <textarea value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}
                rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"/>
            ):(
              <p className="text-sm text-white">{company?.address||'—'}</p>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Carbon Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {label:'Credit Score', value: fmt(company?.carbon_credit_score?.toFixed(1))},
              {label:'Credit Balance', value: fmt(company?.credit_balance)},
              {label:'ESG Score', value: fmt(company?.esg_score?.toFixed(1))},
              {label:'Emission Limit', value: company?.permitted_emission_limit!=null?`${company.permitted_emission_limit} t`:'—'},
              {label:'Daily Limit', value: company?.daily_trading_limit!=null?`${company.daily_trading_limit} credits`:'—'},
              {label:'Traded Today', value: fmt(company?.credits_traded_today)},
            ].map(({label,value})=>(
              <div key={label} className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-lg font-bold text-white mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Wallet size={16} className="text-purple-400"/>Blockchain Wallet
          </h2>
          {company?.wallet_address?(
            <div>
              <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
              <p className="text-sm font-mono text-purple-400 break-all">{company.wallet_address}</p>
            </div>
          ):(
            <div>
              <p className="text-sm text-gray-400 mb-3">
                {company?.status==='approved'?'No wallet yet. Create one to start trading.':'Wallet will be created automatically when government approves your company.'}
              </p>
              {company?.status==='approved'&&(
                <button onClick={()=>walletMutation.mutate()} disabled={walletMutation.isPending}
                  className="bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {walletMutation.isPending?'Creating...':'Create Wallet'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}