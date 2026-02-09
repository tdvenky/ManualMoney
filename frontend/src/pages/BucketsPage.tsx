import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Bucket, BucketType } from '../types';
import { BucketForm } from '../components';
import * as api from '../api/client';

export function BucketsPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadBuckets();
  }, []);

  const loadBuckets = async () => {
    try {
      const data = await api.getBuckets();
      setBuckets(data);
    } catch (err) {
      setError('Failed to load buckets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (name: string, type: BucketType) => {
    try {
      const newBucket = await api.createBucket({ name, type });
      setBuckets([...buckets, newBucket]);
      setShowCreateForm(false);
    } catch (err) {
      setError('Failed to create bucket');
    }
  };

  const handleUpdate = async (id: string, name: string, type: BucketType) => {
    try {
      const updated = await api.updateBucket(id, { name, type });
      setBuckets(buckets.map(b => b.id === id ? updated : b));
      setEditingId(null);
    } catch (err) {
      setError('Failed to update bucket');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bucket?')) return;
    try {
      await api.deleteBucket(id);
      setBuckets(buckets.filter(b => b.id !== id));
    } catch (err) {
      setError('Failed to delete bucket');
    }
  };

  const expenseBuckets = buckets.filter(b => b.type === 'EXPENSE');
  const savingsBuckets = buckets.filter(b => b.type === 'SAVINGS');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-blue-600 hover:text-blue-800">&larr; Back</Link>
          <h1 className="text-2xl font-bold">Buckets</h1>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          New Bucket
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {showCreateForm && (
        <div className="border border-gray-300 bg-white p-4 rounded">
          <h2 className="font-bold mb-4">Create New Bucket</h2>
          <BucketForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {buckets.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No buckets yet. Create your first bucket to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-bold mb-3 text-red-700">Expense Buckets ({expenseBuckets.length})</h2>
            <div className="space-y-2">
              {expenseBuckets.map((bucket) => (
                <div key={bucket.id} className="border border-red-200 bg-red-50 p-3 rounded">
                  {editingId === bucket.id ? (
                    <BucketForm
                      initialName={bucket.name}
                      initialType={bucket.type}
                      submitLabel="Update"
                      onSubmit={(name, type) => handleUpdate(bucket.id, name, type)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{bucket.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(bucket.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(bucket.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {expenseBuckets.length === 0 && (
                <div className="text-gray-400 italic text-sm">No expense buckets</div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 text-green-700">Savings Buckets ({savingsBuckets.length})</h2>
            <div className="space-y-2">
              {savingsBuckets.map((bucket) => (
                <div key={bucket.id} className="border border-green-200 bg-green-50 p-3 rounded">
                  {editingId === bucket.id ? (
                    <BucketForm
                      initialName={bucket.name}
                      initialType={bucket.type}
                      submitLabel="Update"
                      onSubmit={(name, type) => handleUpdate(bucket.id, name, type)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{bucket.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(bucket.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(bucket.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {savingsBuckets.length === 0 && (
                <div className="text-gray-400 italic text-sm">No savings buckets</div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
