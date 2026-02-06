import React, { useState } from 'react';
import { Mail, ShieldCheck, LayoutDashboard, History as HistoryIcon } from 'lucide-react';
import { ScanForm } from './components/ScanForm';
import { InvoiceTable } from './components/InvoiceTable';
import { HistoryTable } from './components/HistoryTable';
import { scanInvoices } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'history'
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const handleScan = async (start, end) => {
    setIsLoading(true);
    try {
      const result = await scanInvoices(start, end);
      setInvoices(result.invoices);
      setStats({
        totalScanned: result.total_emails_scanned,
        found: result.invoices_found,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to scan invoices. Make sure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Mail size={24} className="text-blue-600" />
            <span className="font-bold text-xl tracking-tight text-slate-900">InvoiceScanner</span>
          </div>

          {/* Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <span className="flex items-center gap-2"><LayoutDashboard size={16} /> Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <span className="flex items-center gap-2"><HistoryIcon size={16} /> History</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              <ShieldCheck size={14} />
              <span>Real Mode</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
              U
            </div>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden flex border-t border-slate-100">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 text-sm font-medium text-center ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium text-center ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
          >
            History
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {activeTab === 'dashboard' ? (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500">Scan for new invoices.</p>
              </div>

              <ScanForm onScan={handleScan} isLoading={isLoading} />

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

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">Scan Results</h2>
                <InvoiceTable invoices={invoices} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">History</h1>
                <p className="text-slate-500">View and manage all past invoices.</p>
              </div>
              <HistoryTable />
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
