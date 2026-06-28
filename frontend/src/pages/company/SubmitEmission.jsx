import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/shared/Layout';
import { companiesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, Leaf, Zap, Fuel, Factory } from 'lucide-react';

function Field({ label, name, value, onChange, type = 'number', unit, icon: Icon, required }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}{required && ' *'}</label>
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          step="0.01"
          min="0"
          required={required}
          className={`w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors ${Icon ? 'pl-9 pr-16' : 'px-4'}`}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">{unit}</span>
        )}
      </div>
    </div>
  );
}

export default function SubmitEmission() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    submission_year: new Date().getFullYear(),
    submission_period: '',
    total_co2_emissions: '',
    energy_consumption: '',
    fuel_consumption: '',
    production_volume: '',
    renewable_energy_percentage: '',
    waste_generated: '',
    water_usage: '',
    description: '',
  });
  const [file, setFile] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v !== '' && fd.append(k, v));
      if (file) fd.append('document', file);
      await companiesAPI.submitEmission(fd);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Emission report submitted! AI verification in progress...');
      navigate('/company');
    } catch (err) {
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        Object.entries(errors).forEach(([k, v]) => toast.error(`${k}: ${v}`));
      } else {
        toast.error('Submission failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Submit Emission Report</h1>
          <p className="text-gray-400 text-sm mt-1">Your data will be verified by the AI engine and reviewed by the government authority.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Period */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Leaf size={16} className="text-emerald-400" /> Reporting Period
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Year" name="submission_year" value={form.submission_year} onChange={handleChange} required />
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Period *</label>
                <select
                  name="submission_period"
                  value={form.submission_period}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select period</option>
                  {['Q1', 'Q2', 'Q3', 'Q4', 'Annual'].map(p => (
                    <option key={p} value={`${p}-${form.submission_year}`}>{p} {form.submission_year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Emissions */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Factory size={16} className="text-orange-400" /> Emission Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Total CO₂ Emissions" name="total_co2_emissions" value={form.total_co2_emissions} onChange={handleChange} unit="tons" required />
              <Field label="Energy Consumption" name="energy_consumption" value={form.energy_consumption} onChange={handleChange} unit="MWh" icon={Zap} />
              <Field label="Fuel Consumption" name="fuel_consumption" value={form.fuel_consumption} onChange={handleChange} unit="liters" icon={Fuel} />
              <Field label="Production Volume" name="production_volume" value={form.production_volume} onChange={handleChange} unit="units" />
              <Field label="Renewable Energy" name="renewable_energy_percentage" value={form.renewable_energy_percentage} onChange={handleChange} unit="%" />
              <Field label="Waste Generated" name="waste_generated" value={form.waste_generated} onChange={handleChange} unit="tons" />
              <Field label="Water Usage" name="water_usage" value={form.water_usage} onChange={handleChange} unit="m³" />
            </div>
          </div>

          {/* Description & Document */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Upload size={16} className="text-blue-400" /> Supporting Documentation
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Additional Notes</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Describe any special circumstances or sustainability initiatives..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Upload Document (PDF/Image)</label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-emerald-500/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('doc-upload').click()}>
                  <Upload size={24} className="mx-auto text-gray-500 mb-2" />
                  <p className="text-sm text-gray-400">{file ? file.name : 'Click to upload or drag & drop'}</p>
                  <p className="text-xs text-gray-600 mt-1">PDF, PNG, JPG up to 10MB</p>
                </div>
                <input id="doc-upload" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files[0])} className="hidden" />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/company')}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
