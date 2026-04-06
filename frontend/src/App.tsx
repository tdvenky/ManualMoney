import { useState } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import {
  Dashboard,
  CategoriesPage,
  PayPeriodsPage,
  PayPeriodDetailPage,
  NewPayPeriodPage,
  DataPage,
} from './pages';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/payperiods/new', label: 'New Pay Period', end: true },
  { to: '/payperiods', label: 'History', end: true },
  { to: '/categories', label: 'Categories', end: false },
  { to: '/data', label: 'Data', end: false },
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className={`shrink-0 bg-slate-800 flex flex-col transition-all duration-200 ${sidebarOpen ? 'w-48' : 'w-12'}`}>
        <div className={`flex items-center border-b border-slate-700 ${sidebarOpen ? 'px-4 py-4 justify-between' : 'px-3 py-4 justify-center flex-col gap-2'}`}>
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold leading-none">M</span>
            </div>
            {sidebarOpen && (
              <span className="text-slate-100 font-semibold text-sm whitespace-nowrap">ManualMoney</span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-slate-400 hover:text-slate-200 leading-none"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 p-2 flex-1">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={!sidebarOpen ? label : undefined}
              className={({ isActive }) =>
                `rounded text-sm transition-colors overflow-hidden whitespace-nowrap ${
                  sidebarOpen ? 'px-3 py-2' : 'px-2 py-2 flex justify-center'
                } ${
                  isActive
                    ? 'bg-slate-700 text-slate-100 font-medium'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`
              }
            >
              {sidebarOpen ? label : label.charAt(0)}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-8">
        <div className="max-w-4xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/payperiods" element={<PayPeriodsPage />} />
            <Route path="/payperiods/new" element={<NewPayPeriodPage />} />
            <Route path="/payperiods/:id" element={<PayPeriodDetailPage />} />
            <Route path="/data" element={<DataPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
