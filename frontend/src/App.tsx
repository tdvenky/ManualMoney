import { Routes, Route, NavLink, Link } from 'react-router-dom';
import {
  Dashboard,
  CategoriesPage,
  PayPeriodsPage,
  PayPeriodDetailPage,
  NewPayPeriodPage,
  DataPage,
  MonthlyPage,
} from './pages';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/payperiods', label: 'Pay Periods', end: true },
  { to: '/monthly', label: 'Monthly', end: false },
  { to: '/categories', label: 'Categories', end: false },
  { to: '/data', label: 'Data', end: false },
];

function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top nav bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex items-center gap-6 h-14">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold leading-none">M</span>
              </div>
              <span className="text-slate-800 font-semibold text-sm">ManualMoney</span>
            </Link>
            <nav className="flex items-center gap-1 h-full">
              {navItems.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `relative h-full flex items-center px-3 text-sm transition-colors ${
                      isActive
                        ? 'text-slate-900 font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/payperiods" element={<PayPeriodsPage />} />
          <Route path="/payperiods/new" element={<NewPayPeriodPage />} />
          <Route path="/payperiods/:id" element={<PayPeriodDetailPage />} />
          <Route path="/monthly" element={<MonthlyPage />} />
          <Route path="/data" element={<DataPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
