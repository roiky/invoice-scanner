import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, LayoutDashboard, History as HistoryIcon, Scan, Settings, Plus } from 'lucide-react';
import { ScanForm } from './components/ScanForm';
import { InvoiceTable } from './components/InvoiceTable';
import { LabelManager } from './components/LabelManager';
import { ManualEntryModal } from './components/ManualEntryModal';
import { scanInvoices } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // State for History
  const [historyInvoices, setHistoryInvoices] = useState([]);

  // State for Dashboard Scan
  const [scanResults, setScanResults] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [labels, setLabels] = useState([]);

  // Lifted state for Date Range Persistence
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Fetch History & Labels on Mount
  useEffect(() => {
    fetchHistory();
    fetchLabels();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/invoices');
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistoryInvoices(data);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const fetchLabels = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/labels');
      if (!res.ok) throw new Error("Failed to fetch labels");
      const data = await res.json();
      setLabels(data);
    } catch (err) {
      console.error("Error fetching labels:", err);
    }
  };

  const handleAddLabel = async (newLabel) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel })
      });
      const updatedLabels = await res.json();
      setLabels(updatedLabels);
    } catch (err) {
      console.error("Error adding label:", err);
    }
  };

  const handleDeleteLabel = async (labelToDelete) => {
    // Check if label is in use
    const isInUse = historyInvoices.some(inv => (inv.labels || []).includes(labelToDelete));
    if (isInUse) {
      alert(`Cannot delete label "${labelToDelete}" because it is currently assigned to one or more invoices.`);
      return;
    }

    if (!window.confirm(`Delete label "${labelToDelete}"?`)) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/labels/${labelToDelete}`, {
        method: 'DELETE'
      });
      const updatedLabels = await res.json();
      setLabels(updatedLabels);
    } catch (err) {
      console.error("Error deleting label:", err);
    }
  };

  const handleUpdateInvoice = (updatedInvoice) => {
    // Update both lists if the invoice is present
    setHistoryInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
    setScanResults(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
  };

  const handleDeleteInvoice = (deletedId) => {
    setHistoryInvoices(prev => prev.filter(inv => inv.id !== deletedId));
    setScanResults(prev => prev.filter(inv => inv.id !== deletedId));
  };

  const handleScan = async (start, end) => {
    setLoading(true);
    setError(null);
    try {
      const result = await scanInvoices(start, end);
      setScanResults(result.invoices);

      // Refresh history silently
      fetchHistory();

      setStats({
        totalScanned: result.total_emails_scanned,
        found: result.invoices_found,
      });
    } catch (err) {
      console.error(err);
      setError("Failed to scan invoices. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              InvoiceScanner
            </h1>
          </div>

          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard size={18} />
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'history'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <div className="flex items-center gap-2">
                <HistoryIcon size={18} />
                History
              </div>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
              <p className="text-slate-500">Scan your emails for invoices.</p>
            </div>

            <ScanForm
              onScan={handleScan}
              isLoading={loading}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />

            {/* Results Section */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-500">Scanning your emails...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                  <div className="text-sm text-slate-500">Emails Scanned</div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalScanned}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                  <div className="text-sm text-slate-500">Invoices Found</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.found}</div>
                </div>
              </div>
            )}

            {!loading && !error && scanResults.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">Scan Results</h2>
                <InvoiceTable
                  invoices={scanResults}
                  availableLabels={labels}
                  onUpdateInvoice={handleUpdateInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">History</h2>
              <p className="text-slate-500">Manage your invoice history and labels.</p>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <LabelManager
                  labels={labels}
                  onAddLabel={handleAddLabel}
                  onDeleteLabel={handleDeleteLabel}
                />
              </div>
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Plus size={20} />
                Add Manual
              </button>
            </div>

            <InvoiceTable
              invoices={historyInvoices}
              availableLabels={labels}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
            />

            <ManualEntryModal
              isOpen={isManualModalOpen}
              onClose={() => setIsManualModalOpen(false)}
              onSave={(newInv) => {
                setHistoryInvoices(prev => [newInv, ...prev]);
              }}
            />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
