'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { SkuMasterItem } from '../../lib/types';
import { NavigationRail } from '../../components/NavigationRail';
import { Database, Plus, Search, Edit2, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SkuMasterPage() {
  const [skus, setSkus] = useState<SkuMasterItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSku, setEditingSku] = useState<SkuMasterItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    skuErpCode: '',
    name: '',
    eanCode: '',
    hsnCode: '',
    uom: 'Pcs',
    agreedRate: 0,
    mrp: 0,
    priceTolerance: 0.05
  });
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const loadSkus = async (query = '') => {
    try {
      setLoading(true);
      const res = await api.fetchSkus(query);
      setSkus(res.skus || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load SKU Master catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkus(search);
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingSku(null);
    setFormData({
      skuErpCode: '',
      name: '',
      eanCode: '',
      hsnCode: '',
      uom: 'Pcs',
      agreedRate: 0,
      mrp: 0,
      priceTolerance: 0.05
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sku: SkuMasterItem) => {
    setEditingSku(sku);
    setFormData({
      skuErpCode: sku.skuErpCode,
      name: sku.name,
      eanCode: sku.eanCode || '',
      hsnCode: sku.hsnCode || '',
      uom: sku.uom || 'Pcs',
      agreedRate: sku.agreedRate,
      mrp: sku.mrp,
      priceTolerance: sku.priceTolerance || 0.05
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete SKU ${code}?`)) return;
    try {
      await api.deleteSku(id);
      setSuccessMsg(`SKU ${code} deleted successfully.`);
      loadSkus(search);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete SKU');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.skuErpCode || !formData.name) {
      setErrorMsg('SKU ERP Code and Name are required');
      return;
    }

    try {
      if (editingSku) {
        await api.updateSku(editingSku._id, formData);
        setSuccessMsg(`SKU ${formData.skuErpCode} updated successfully.`);
      } else {
        await api.createSku(formData);
        setSuccessMsg(`SKU ${formData.skuErpCode} created successfully.`);
      }
      setIsModalOpen(false);
      loadSkus(search);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save SKU');
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-100">
      <NavigationRail />

      <main className="flex-1 flex flex-col min-w-0 p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">SKU Master Catalogue</h1>
              <p className="text-xs text-slate-500">Manage vendor item codes, agreed rates, and price tolerances for 3-way matching</p>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New SKU
          </button>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ERP Code, Name, EAN, or HSN Code..."
            className="w-full text-sm focus:outline-none bg-transparent"
          />
        </div>

        {/* SKU Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-3 px-4">ERP Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">EAN Code</th>
                  <th className="py-3 px-4">HSN Code</th>
                  <th className="py-3 px-4 text-center">UOM</th>
                  <th className="py-3 px-4 text-right">Agreed Rate</th>
                  <th className="py-3 px-4 text-right">MRP</th>
                  <th className="py-3 px-4 text-center">Tolerance</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">Loading SKU Master records...</td>
                  </tr>
                ) : skus.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">No SKU Master records found. Click &quot;Add New SKU&quot; or seed sample data.</td>
                  </tr>
                ) : (
                  skus.map((sku) => (
                    <tr key={sku._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{sku.skuErpCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{sku.name}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{sku.eanCode || '-'}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{sku.hsnCode || '-'}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{sku.uom || 'Pcs'}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{sku.agreedRate?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">₹{sku.mrp?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-600">{((sku.priceTolerance || 0.05) * 100).toFixed(0)}%</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(sku)}
                            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Edit SKU"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sku._id, sku.skuErpCode)}
                            className="p-1.5 rounded hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Delete SKU"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingSku ? `Edit SKU ${editingSku.skuErpCode}` : 'Add New SKU Master'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SKU ERP Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.skuErpCode}
                    onChange={(e) => setFormData({ ...formData, skuErpCode: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono"
                    placeholder="e.g. 11423"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">EAN Code</label>
                  <input
                    type="text"
                    value={formData.eanCode}
                    onChange={(e) => setFormData({ ...formData, eanCode: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono"
                    placeholder="Alternate Lookup Key"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Description / Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  placeholder="e.g. Cheesy Spicy Veg Momos 24.0 Pieces"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                    placeholder="e.g. 19022010"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">UOM</label>
                  <input
                    type="text"
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                    placeholder="Pcs / Pack"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Agreed Rate (₹) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.agreedRate}
                    onChange={(e) => setFormData({ ...formData, agreedRate: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tolerance (Fraction)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.priceTolerance}
                    onChange={(e) => setFormData({ ...formData, priceTolerance: parseFloat(e.target.value) || 0.05 })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                    placeholder="0.05 = 5%"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm"
                >
                  Save SKU Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
