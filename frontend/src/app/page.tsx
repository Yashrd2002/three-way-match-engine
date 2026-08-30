'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ThreeWayMatchResult, SummaryResult } from '../lib/types';
import { NavigationRail } from '../components/NavigationRail';
import { TopTabs, TabType } from '../components/TopTabs';
import { SubTabPills } from '../components/SubTabPills';
import { MismatchBanner } from '../components/MismatchBanner';
import { FormPanel } from '../components/FormPanel';
import { FilePreview } from '../components/FilePreview';
import { ItemGrid } from '../components/ItemGrid';
import { SummaryView } from '../components/SummaryView';
import { UploadModal } from '../components/UploadModal';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [poNumber, setPoNumber] = useState<string>('CI4PO05788');
  const [activeTab, setActiveTab] = useState<TabType>('po');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [matchResult, setMatchResult] = useState<ThreeWayMatchResult | null>(null);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const loadMatchData = async (targetPo: string) => {
    try {
      setLoading(true);
      const [match, summary] = await Promise.all([
        api.fetchMatch(targetPo),
        api.fetchSummary(targetPo)
      ]);
      setMatchResult(match);
      setSummaryResult(summary);
    } catch (err) {
      console.error('Error fetching match:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchData(poNumber);
  }, [poNumber]);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await api.seedSampleData();
      await loadMatchData(poNumber);
    } catch (err) {
      console.error('Seed failed:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handlePoChange = (newPo: string) => {
    setPoNumber(newPo);
    setSelectedDocId('');
  };

  // Extract linked documents for active tab
  const pos = matchResult?.documents?.pos || [];
  const grns = matchResult?.documents?.grns || [];
  const invoices = matchResult?.documents?.invoices || [];

  // Determine active document
  let activeDoc: any = null;
  let activeDocType: 'PO' | 'GRN' | 'Invoice' = 'PO';

  if (activeTab === 'po') {
    activeDoc = pos[0] || null;
    activeDocType = 'PO';
  } else if (activeTab === 'fulfillment') {
    activeDoc = invoices.find(i => i._id === selectedDocId) || invoices[0] || null;
    activeDocType = 'Invoice';
  } else if (activeTab === 'delivery') {
    activeDoc = grns.find(g => g._id === selectedDocId) || grns[0] || null;
    activeDocType = 'GRN';
  }

  // Construct Form Sections based on active tab and document details
  const getFormSections = () => {
    if (!activeDoc) return [];

    if (activeDocType === 'PO') {
      return [
        {
          title: 'Purchase Order Information',
          fields: [
            { label: 'Vendor Name', value: activeDoc.vendorName || 'M/s AFP' },
            { label: 'PO No', value: activeDoc.poNumber },
            { label: 'PO Date', value: activeDoc.poDate || 'Mar 17, 2026' },
            { label: 'Payment Terms', value: '0 Days' },
            { label: 'Expected Delivery', value: 'Apr 02, 2026' },
            { label: 'PO Expiry Date', value: 'Apr 04, 2026' },
            { label: 'GSTIN', value: '27ABACA2423J1Z0' },
            { label: 'PAN', value: 'AAACA2423J' }
          ]
        },
        {
          title: 'Billing & Shipping Address',
          fields: [
            { label: 'Billing Address', value: 'CLOUDSTORE RETAIL PRIVATE LIMITED' },
            { label: 'Shipping Address', value: 'B-400, One K- Square Park, Padgha-Bhiwandi' },
            { label: 'Contact No', value: '8587935434' },
            { label: 'GSTIN', value: '27AAKCC0172C1Z1' }
          ]
        }
      ];
    }

    if (activeDocType === 'GRN') {
      return [
        {
          title: 'Goods Receipt Note Details',
          fields: [
            { label: 'GRN No', value: activeDoc.grnNumber },
            { label: 'PO No', value: activeDoc.poNumber },
            { label: 'Inbound No', value: 'CI4000020359' },
            { label: 'GRN Date', value: activeDoc.grnDate || '24-3-2026' },
            { label: 'Invoice No', value: 'IN25MH2504251' },
            { label: 'Invoice Date', value: '24-3-2026' },
            { label: 'Vendor Name', value: 'M/s AFP' },
            { label: 'SKU Bin', value: 'B2B STAGING' }
          ]
        }
      ];
    }

    if (activeDocType === 'Invoice') {
      return [
        {
          title: 'Tax Invoice Details',
          fields: [
            { label: 'Invoice No', value: activeDoc.invoiceNumber },
            { label: 'Invoice Date', value: activeDoc.invoiceDate || '24/03/2026' },
            { label: 'Customer Order No', value: activeDoc.poNumber },
            { label: 'State', value: 'Maharashtra (27)' },
            { label: 'Transport', value: 'JWL Cold Store Pvt. Ltd.' },
            { label: 'Vehicle No', value: 'MH12WX9609' },
            { label: 'GSTIN', value: '27ABACA2423J1Z0' },
            { label: 'Bill To', value: 'Cloudstore Retail Private Limited' }
          ]
        }
      ];
    }

    return [];
  };

  // Sub-tab pills for multiple Invoices/GRNs
  const getSubTabPills = () => {
    if (activeTab === 'fulfillment') {
      return invoices.map(inv => ({
        id: inv._id,
        label: `Invoice: ${inv.invoiceNumber}`,
        sublabel: inv.invoiceDate || 'Raised'
      }));
    }
    if (activeTab === 'delivery') {
      return grns.map(grn => ({
        id: grn._id,
        label: `GRN: ${grn.grnNumber}`,
        sublabel: grn.grnDate || 'Received'
      }));
    }
    return [];
  };

  const fileUrl = activeDoc ? api.getFileUrl(activeDoc._id) : undefined;

  return (
    <div className="flex w-full min-h-screen bg-slate-100 overflow-hidden">
      {/* Left Navigation Rail */}
      <NavigationRail onSeed={handleSeed} isSeeding={isSeeding} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Tabs */}
        <TopTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          poCount={pos.length}
          fulfillmentCount={invoices.length}
          deliveryCount={grns.length}
          poNumber={poNumber}
          onPoNumberChange={handlePoChange}
          onUploadClick={() => setIsUploadOpen(true)}
        />

        {/* Sub-tab pills for Fulfillment/Delivery */}
        {(activeTab === 'fulfillment' || activeTab === 'delivery') && (
          <SubTabPills
            pills={getSubTabPills()}
            activeId={selectedDocId || (activeTab === 'fulfillment' ? invoices[0]?._id : grns[0]?._id) || ''}
            onSelectPill={setSelectedDocId}
          />
        )}

        {/* Tab Body View */}
        <div className="p-6 space-y-6 flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-16 text-slate-500 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="font-semibold text-sm">Evaluating Three-Way Match Engine...</span>
            </div>
          ) : activeTab === 'summary' ? (
            <SummaryView summary={summaryResult} loading={loading} />
          ) : (
            <>
              {/* Mismatch / Soft Warning Banner */}
              {matchResult && (
                <MismatchBanner
                  status={matchResult.status}
                  reasons={matchResult.reasons}
                />
              )}

              {/* Two-Column Panel: Left Form Panel + Right Original File Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormPanel
                  title={`${activeDocType} Header Details`}
                  sections={getFormSections()}
                  accentColor={
                    activeDocType === 'PO'
                      ? 'border-emerald-500'
                      : activeDocType === 'GRN'
                      ? 'border-indigo-500'
                      : 'border-purple-500'
                  }
                />

                <FilePreview
                  fileUrl={fileUrl}
                  filename={activeDoc?.originalFilename || `${activeDocType}_${poNumber}.pdf`}
                />
              </div>

              {/* Bottom Full-Width Item Grid */}
              <ItemGrid
                items={matchResult?.items || []}
                docType={activeDocType}
              />
            </>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(uploadedPo) => {
          setPoNumber(uploadedPo);
          loadMatchData(uploadedPo);
        }}
        defaultPoNumber={poNumber}
      />
    </div>
  );
}
