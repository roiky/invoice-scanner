import React, { useState, useEffect, useMemo } from 'react'
import { LayoutDashboard, History, Settings, FileText, CheckCircle, AlertCircle, Search, ShieldCheck, DollarSign, Plus, Globe, Scan, Gavel } from 'lucide-react'
import * as api from './api'
import { InvoiceTable } from './components/InvoiceTable'
import { ScanForm } from './components/ScanForm'
import { ManualEntryModal } from './components/ManualEntryModal'
import { StatsCard } from './components/StatsCard'
import { LabelManager } from './components/LabelManager'
import { RulesTab } from './components/RulesTab'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './hooks/useTheme';
import { Moon, Sun } from 'lucide-react'

function AppContent() {
  const { t, language, setLanguage, dir } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard')
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [scanResults, setScanResults] = useState([])
  // Date state for scan form
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    // Format to YYYY-MM-DD using local time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Labels state
  const [labels, setLabels] = useState([])

  // User state
  const [user, setUser] = useState(null)

  // Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)

  // Language Menu State
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)

  // Fetch initial data
  useEffect(() => {
    fetchHistory()
    fetchLabels()
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const profile = await api.getProfile()
    if (profile && profile.email) {
      setUser(profile)
    }
  }

  const handleLogout = async () => {
    if (confirm(t('auth.logout_confirm'))) {
      await api.logout()
      window.location.reload()
    }
  }

  const fetchHistory = async () => {
    try {
      const data = await api.getInvoices()
      setInvoices(data)
    } catch (err) {
      console.error("Failed to fetch history:", err)
    }
  }

  const fetchLabels = async () => {
    try {
      const data = await api.getLabels()
      setLabels(data)
    } catch (err) {
      console.error("Failed to fetch labels:", err)
    }
  }

  const handleScan = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setStats(null)
    setScanResults([])

    try {
      const data = await api.scanInvoices(startDate, endDate)
      if (data && data.invoices) {
        setStats({
          totalScanned: data.total_emails_scanned,
          found: data.invoices_found
        })
        setScanResults(data.invoices)
        // Refresh history to include new invoices
        fetchHistory()
      } else {
        setError('Scan failed to return valid results')
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateInvoice = async (updatedInvoice) => {
    try {
      const result = await api.updateInvoice(updatedInvoice.id, updatedInvoice);
      setInvoices(prev => prev.map(inv => inv.id === result.id ? result : inv));
      setScanResults(prev => prev.map(inv => inv.id === result.id ? result : inv));
      return result;
    } catch (err) {
      console.error("Failed to update invoice:", err);
      throw err;
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await api.deleteInvoice(invoiceId);
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      setScanResults(prev => prev.filter(inv => inv.id !== invoiceId));
    } catch (err) {
      console.error("Failed to delete invoice:", err);
      alert("Failed to delete invoice");
    }
  };

  const handleBulkDelete = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} selected invoices?`)) return;

    for (const id of ids) {
      try {
        await api.deleteInvoice(id);
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        setScanResults(prev => prev.filter(inv => inv.id !== id));
      } catch (err) {
        console.error(`Failed to delete invoice ${id}`, err);
      }
    }
  };

  const handleBulkStatusChange = async (ids, newStatus) => {
    for (const id of ids) {
      const inv = invoices.find(i => i.id === id) || scanResults.find(i => i.id === id);
      if (!inv) continue;

      try {
        const updatedInv = { ...inv, status: newStatus };
        await api.updateInvoice(id, updatedInv);
        setInvoices(prev => prev.map(i => i.id === id ? updatedInv : i));
        setScanResults(prev => prev.map(i => i.id === id ? updatedInv : i));
      } catch (err) {
        console.error(`Failed to update status for ${id}`, err);
      }
    }
  };

  const handleBulkAddLabel = async (ids, labelName) => {
    for (const id of ids) {
      const inv = invoices.find(i => i.id === id) || scanResults.find(i => i.id === id);
      if (!inv) continue;

      // Avoid duplicates
      if (inv.labels && inv.labels.includes(labelName)) continue;

      try {
        const currentLabels = inv.labels || [];
        const updatedInv = { ...inv, labels: [...currentLabels, labelName] };
        await api.updateInvoice(id, updatedInv);
        setInvoices(prev => prev.map(i => i.id === id ? updatedInv : i));
        setScanResults(prev => prev.map(i => i.id === id ? updatedInv : i));
      } catch (err) {
        console.error(`Failed to add label for ${id}`, err);
      }
    }
  };

  const handleAddLabel = async (labelName) => {
    try {
      await api.createLabel(labelName);
      // Optimistic update or refetch
      setLabels(prev => [...prev, labelName]);
    } catch (err) {
      console.error("Failed to create label:", err);
      alert("Failed to create label");
    }
  };

  const handleDeleteLabel = async (labelName) => {
    if (!window.confirm(`Delete label "${labelName}"?`)) return;
    try {
      await api.deleteLabel(labelName);
      setLabels(prev => prev.filter(l => l !== labelName));
      // Also remove this label from all invoices in UI for consistency
      const stripLabel = (list) => list.map(inv => ({
        ...inv,
        labels: inv.labels ? inv.labels.filter(l => l !== labelName) : []
      }));

      setInvoices(prev => stripLabel(prev));
      setScanResults(prev => stripLabel(prev));
    } catch (err) {
      console.error("Failed to delete label:", err);
      alert("Failed to delete label");
    }
  };

  const handleManualEntrySuccess = (newInvoice) => {
    setInvoices(prev => [newInvoice, ...prev]);
    setIsManualModalOpen(false);
  };


  // Setup Stats for History (using DB data)
  const totalInvoicesAllTime = invoices.length;
  // Calculate total amount (simple sum, ignoring currency mixed for now or assuming ILS)
  const totalAmountAllTime = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  // Derived state for history tab - just use all invoices
  const historyInvoices = invoices;

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 ${language === 'he' ? 'font-hebrew' : ''}`}>
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300">
        <div className="max-w-[80%] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 font-display">
                {t('app.name')}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">{t('app.workspace')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-xl border border-slate-200/50">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
              >
                <LayoutDashboard size={18} />
                {t('nav.dashboard')}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeTab === 'history'
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
              >
                <History size={18} />
                {t('nav.history')}
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeTab === 'rules'
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
              >
                <Gavel size={18} />
                {t('rules.title')}
              </button>
            </nav>

            {/* Theme Toggle */}
            <button
              onClick={() => {
                console.log('Theme toggle button clicked');
                toggleTheme();
              }}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-2"
              >
                <Globe size={20} />
                <span className="text-sm font-medium uppercase">{language}</span>
              </button>

              {isLangMenuOpen && (
                <div className={`absolute top-full mt-2 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 overflow-hidden z-50 ${dir === 'rtl' ? 'left-0' : 'right-0'}`}>
                  <button
                    onClick={() => { setLanguage('en'); setIsLangMenuOpen(false); }}
                    className={`w-full px-4 py-2 text-sm text-start hover:bg-slate-50 transition-colors ${language === 'en' ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-slate-600'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { setLanguage('he'); setIsLangMenuOpen(false); }}
                    className={`w-full px-4 py-2 text-sm text-start hover:bg-slate-50 transition-colors ${language === 'he' ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-slate-600'}`}
                  >
                    עברית
                  </button>
                </div>
              )}
            </div>

            {/* User Profile & Logout */}
            {user ? (
              <div className="flex items-center gap-3 ps-4 border-s border-slate-200">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('auth.connected_as')}</span>
                  <span className="text-xs font-medium text-slate-700">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                  title={t('auth.logout')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  try {
                    const profile = await api.login();
                    if (profile && profile.email) {
                      setUser(profile);
                      window.location.reload();
                    }
                  } catch (err) {
                    alert("Login failed! See console for details.");
                    console.error(err);
                  }
                }}
                className="ms-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                {t('auth.connect') || "Connect Gmail"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {activeTab === 'dashboard' ? (
          <div className="space-y-8">
            {/* Greeting & Stats */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-display">{t('dashboard.welcome')}</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.subtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  title={t('dashboard.stats.total_invoices')}
                  value={totalInvoicesAllTime}
                  icon={FileText}
                  color="blue"
                />
                <StatsCard
                  title={t('dashboard.stats.total_volume')}
                  value={`₪${totalAmountAllTime.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  icon={DollarSign}
                  color="green"
                />
                <StatsCard
                  title={t('dashboard.stats.new_invoices')}
                  value={scanResults.length}
                  icon={CheckCircle}
                  color="indigo"
                />
              </div>
            </div>

            <ScanForm
              onScan={handleScan}
              isLoading={loading}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              t={t} // Pass t function
              dir={dir}
            />

            {/* Results Section */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                  <div className="relative p-4 bg-white rounded-full shadow-lg border border-blue-100">
                    <Scan className="text-blue-600 animate-pulse" size={32} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-6">{t('scan.results_title')}</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{t('scan.results_desc')}</p>
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
                  <p className="text-sm text-slate-500 font-medium">{t('dashboard.stats.emails_scanned')}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalScanned}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-500 font-medium">{t('dashboard.stats.new_invoices')}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.found}</p>
                </div>
              </div>
            )}

            {!loading && !error && scanResults.length > 0 && (
              <div className="space-y-4 pt-4">
                <InvoiceTable
                  invoices={scanResults}
                  availableLabels={labels}
                  onUpdateInvoice={handleUpdateInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                  onBulkDelete={handleBulkDelete}
                  onBulkStatusChange={handleBulkStatusChange}
                  onBulkAddLabel={handleBulkAddLabel}
                  t={t}
                  dir={dir}
                />
              </div>
            )}
          </div>
        ) : activeTab === 'history' ? (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-display">{t('history.title')}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{t('history.subtitle')}</p>
              </div>

              <button
                onClick={() => setIsManualModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm"
              >
                <Plus size={18} />
                {t('history.add_manual')}
              </button>
            </div>

            {/* Label Manager (Collapsible) */}
            <LabelManager
              labels={labels}
              onAddLabel={handleAddLabel}
              onDeleteLabel={handleDeleteLabel}
              t={t}
            />

            <InvoiceTable
              invoices={historyInvoices}
              availableLabels={labels}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onBulkDelete={handleBulkDelete}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkAddLabel={handleBulkAddLabel}
              t={t}
              dir={dir}
            />
          </div>
        ) : activeTab === 'rules' ? (
          <RulesTab t={t} labels={labels} />
        ) : null}
      </main>

      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleManualEntrySuccess}
        availableLabels={labels}
        t={t}
      />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </LanguageProvider>
  )
}

export default App;
