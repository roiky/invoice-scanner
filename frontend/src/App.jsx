import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, LayoutDashboard, History as HistoryIcon, Scan, Settings, Plus, DollarSign, FileText, CheckCircle, BarChart3 } from 'lucide-react';
import { ScanForm } from './components/ScanForm';
import { InvoiceTable } from './components/InvoiceTable';
import { LabelManager } from './components/LabelManager';
import { ManualEntryModal } from './components/ManualEntryModal';
import { StatsCard } from './components/StatsCard';
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

  // Derived Statistics for Dashboard
  const totalInvoicesAllTime = historyInvoices.length;
  const totalAmountAllTime = historyInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
  const totalProcessed = historyInvoices.filter(i => i.status === 'Processed').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* Glass Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300">
              <Scan className="text-white" size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                InvoiceScanner
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Workspace</p>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeTab === 'dashboard'
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeTab === 'history'
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
              <HistoryIcon size={18} />
              History
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[80%] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {activeTab === 'dashboard' ? (
          <div className="space-y-8">
            {/* Greeting & Stats */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 font-display">Welcome Back</h2>
                  <p className="text-slate-500 mt-1">Here's what's happening with your invoices.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  title="Total Invoices"
                  value={totalInvoicesAllTime}
                  icon={FileText}
                  color="blue"
                />
                <StatsCard
                  title="Total Volume"
                  value={`₪${totalAmountAllTime.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  icon={DollarSign}
                  color="green"
                  trend={12}
                />
                <StatsCard
                  title="Processed"
                  value={totalProcessed}
                  icon={CheckCircle}
                  color="purple"
                />
              </div>
            </div>

            <div className="h-px bg-slate-200/60 w-full" />

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Scan Invoices</h3>
              </div>

              <ScanForm
                onScan={handleScan}
                isLoading={loading}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
              />
            </div>

            {/* Results Section */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                  <div className="relative p-4 bg-white rounded-full shadow-lg border border-blue-100">
                    <Scan className="text-blue-600 animate-pulse" size={32} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mt-6">Scanning your inbox...</h3>
                <p className="text-slate-400 text-sm mt-1">This might take a moment depending on the date range.</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full"><ShieldCheck size={18} /></div>
                {error}
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-500 font-medium">Emails Scanned</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalScanned}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-500 font-medium">New Invoices Found</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.found}</p>
                </div>
              </div>
            )}

            {!loading && !error && scanResults.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Latest Scan Results</h2>
                  <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{scanResults.length} found</span>
                </div>
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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 font-display">Invoice History</h2>
                <p className="text-slate-500 mt-1">Manage, categorize, and export your invoices.</p>
              </div>

              <button
                onClick={() => setIsManualModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm"
              >
                <Plus size={18} />
                Add Manual Invoice
              </button>
            </div>

            {/* Label Manager (Collapsible) */}
            <LabelManager
              labels={labels}
              onAddLabel={handleAddLabel}
              onDeleteLabel={handleDeleteLabel}
            />

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
