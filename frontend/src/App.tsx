import { Routes, Route, Link } from 'react-router-dom';
import {
  Dashboard,
  BucketsPage,
  PayPeriodDetailPage,
  NewPayPeriodPage,
  DataPage,
} from './pages';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-xl font-bold font-mono">
              ManualMoney
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link to="/" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link to="/buckets" className="text-gray-600 hover:text-gray-900">Buckets</Link>
              <Link to="/data" className="text-gray-600 hover:text-gray-900">Export/Import</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/buckets" element={<BucketsPage />} />
          <Route path="/payperiods/new" element={<NewPayPeriodPage />} />
          <Route path="/payperiods/:id" element={<PayPeriodDetailPage />} />
          <Route path="/data" element={<DataPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
