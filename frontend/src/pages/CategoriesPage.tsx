import { useState, useEffect } from 'react';
import type { Category, SubCategory, CategoryType } from '../types';
import * as api from '../api/client';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<CategoryType>('EXPENSE');

  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [subCatName, setSubCatName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catsData, subCatsData] = await Promise.all([
        api.getCategories(),
        api.getSubCategories(),
      ]);
      setCategories(catsData);
      setSubCategories(subCatsData);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openNewCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatType('EXPENSE');
    setShowCategoryForm(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, { name: catName, type: catType });
      } else {
        await api.createCategory({ name: catName, type: catType });
      }
      setShowCategoryForm(false);
      await loadData();
    } catch {
      setError('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.deleteCategory(id);
      await loadData();
    } catch {
      setError('Failed to delete category');
    }
  };

  const openNewSubCategory = () => {
    setEditingSubCategory(null);
    setSubCatName('');
    setShowSubCategoryForm(true);
  };

  const openEditSubCategory = (sub: SubCategory) => {
    setEditingSubCategory(sub);
    setSubCatName(sub.name);
    setShowSubCategoryForm(true);
  };

  const handleSaveSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubCategory) {
        await api.updateSubCategory(editingSubCategory.id, { name: subCatName });
      } else {
        await api.createSubCategory({ name: subCatName });
      }
      setShowSubCategoryForm(false);
      await loadData();
    } catch {
      setError('Failed to save sub-category');
    }
  };

  const handleDeleteSubCategory = async (id: string) => {
    if (!confirm('Delete this sub-category?')) return;
    try {
      await api.deleteSubCategory(id);
      await loadData();
    } catch {
      setError('Failed to delete sub-category');
    }
  };

  const handleMoveCategory = async (id: string, direction: 'up' | 'down') => {
    const cat = categories.find(c => c.id === id)!;
    const group = categories.filter(c => c.type === cat.type);
    const idx = group.findIndex(c => c.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= group.length) return;
    const newGroup = [...group];
    [newGroup[idx], newGroup[swapIdx]] = [newGroup[swapIdx], newGroup[idx]];
    const other = categories.filter(c => c.type !== cat.type);
    const newCategories = cat.type === 'EXPENSE' ? [...newGroup, ...other] : [...other, ...newGroup];
    setCategories(newCategories);
    try {
      await api.reorderCategories(newCategories.map(c => c.id));
    } catch {
      setError('Failed to reorder categories');
      setCategories(categories);
    }
  };

  const handleMoveSubCategory = async (id: string, direction: 'up' | 'down') => {
    const idx = subCategories.findIndex(s => s.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= subCategories.length) return;
    const newList = [...subCategories];
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    setSubCategories(newList);
    try {
      await api.reorderSubCategories(newList.map(s => s.id));
    } catch {
      setError('Failed to reorder sub-categories');
      setSubCategories(subCategories);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>;
  }

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
  const savingsCategories = categories.filter(c => c.type === 'SAVINGS');

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-slate-800">Categories & Sub-Categories</h1>

      {error && (
        <div className="bg-red-50 border-[0.5px] border-red-200 text-red-700 px-3 py-2 rounded-[10px] text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      {/* Categories */}
      <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[11px] font-bold text-slate-500 tracking-wider">CATEGORIES</h2>
          <button
            onClick={openNewCategory}
            className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-[7px] hover:bg-emerald-700"
          >
            New Category
          </button>
        </div>

        {showCategoryForm && (
          <form onSubmit={handleSaveCategory} className="mb-4 border-[0.5px] border-slate-200 rounded-[10px] p-4 bg-slate-50">
            <h3 className="text-sm font-medium text-slate-800 mb-3">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[11px] text-slate-500 mb-1">Name</label>
                <input
                  type="text"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  className="w-full border-[0.5px] border-slate-300 rounded-[7px] px-3 py-1.5 text-sm text-slate-800"
                  placeholder="e.g. Groceries"
                  required
                  autoFocus
                />
              </div>
              <div className="w-36">
                <label className="block text-[11px] text-slate-500 mb-1">Type</label>
                <select
                  value={catType}
                  onChange={e => setCatType(e.target.value as CategoryType)}
                  className="w-full border-[0.5px] border-slate-300 rounded-[7px] px-3 py-1.5 text-sm text-slate-800"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="SAVINGS">Savings</option>
                </select>
              </div>
              <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-[7px] hover:bg-emerald-700">
                {editingCategory ? 'Save' : 'Add'}
              </button>
              <button type="button" onClick={() => setShowCategoryForm(false)} className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-[7px] hover:bg-slate-600">
                Cancel
              </button>
            </div>
          </form>
        )}

        {categories.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">No categories yet.</div>
        ) : (
          <div className="space-y-4">
            {expenseCategories.length > 0 && (
              <div>
                <div className="text-[11px] text-slate-400 font-bold tracking-wider mb-1">EXPENSES</div>
                <div className="space-y-0.5">
                  {expenseCategories.map((cat, idx) => (
                    <div key={cat.id} className="flex justify-between items-center py-1.5 px-3 rounded-[7px] hover:bg-slate-50 group">
                      <span className="text-sm text-slate-800">{cat.name}</span>
                      <div className="flex gap-2 items-center">
                        <button onClick={() => handleMoveCategory(cat.id, 'up')} disabled={idx === 0} className="text-slate-300 hover:text-slate-500 disabled:opacity-30 disabled:cursor-default" title="Move up">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button onClick={() => handleMoveCategory(cat.id, 'down')} disabled={idx === expenseCategories.length - 1} className="text-slate-300 hover:text-slate-500 disabled:opacity-30 disabled:cursor-default" title="Move down">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        <button onClick={() => openEditCategory(cat)} className="text-slate-400 hover:text-emerald-600" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-400 hover:text-red-500" title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {savingsCategories.length > 0 && (
              <div>
                <div className="text-[11px] text-slate-400 font-bold tracking-wider mb-1">SAVINGS</div>
                <div className="space-y-0.5">
                  {savingsCategories.map((cat, idx) => (
                    <div key={cat.id} className="flex justify-between items-center py-1.5 px-3 rounded-[7px] hover:bg-slate-50 group">
                      <span className="text-sm text-slate-800">{cat.name}</span>
                      <div className="flex gap-2 items-center">
                        <button onClick={() => handleMoveCategory(cat.id, 'up')} disabled={idx === 0} className="text-slate-300 hover:text-slate-500 disabled:opacity-30 disabled:cursor-default" title="Move up">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button onClick={() => handleMoveCategory(cat.id, 'down')} disabled={idx === savingsCategories.length - 1} className="text-slate-300 hover:text-slate-500 disabled:opacity-30 disabled:cursor-default" title="Move down">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        <button onClick={() => openEditCategory(cat)} className="text-slate-400 hover:text-emerald-600" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-400 hover:text-red-500" title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub-Categories */}
      <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[11px] font-bold text-slate-500 tracking-wider">SUB-CATEGORIES</h2>
          <button
            onClick={openNewSubCategory}
            className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-[7px] hover:bg-emerald-700"
          >
            New Sub-Category
          </button>
        </div>

        {showSubCategoryForm && (
          <form onSubmit={handleSaveSubCategory} className="mb-4 border-[0.5px] border-slate-200 rounded-[10px] p-4 bg-slate-50">
            <h3 className="text-sm font-medium text-slate-800 mb-3">{editingSubCategory ? 'Edit Sub-Category' : 'New Sub-Category'}</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[11px] text-slate-500 mb-1">Name</label>
                <input
                  type="text"
                  value={subCatName}
                  onChange={e => setSubCatName(e.target.value)}
                  className="w-full border-[0.5px] border-slate-300 rounded-[7px] px-3 py-1.5 text-sm text-slate-800"
                  placeholder="e.g. Indian Grocery"
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-[7px] hover:bg-emerald-700">
                {editingSubCategory ? 'Save' : 'Add'}
              </button>
              <button type="button" onClick={() => setShowSubCategoryForm(false)} className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-[7px] hover:bg-slate-600">
                Cancel
              </button>
            </div>
          </form>
        )}

        {subCategories.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">No sub-categories yet.</div>
        ) : (
          <div className="space-y-0.5">
            {subCategories.map((sub, idx) => (
              <div key={sub.id} className="flex justify-between items-center py-1.5 px-3 rounded-[7px] hover:bg-slate-50 group">
                <span className="text-sm text-slate-800">{sub.name}</span>
                <div className="flex gap-2 items-center">
                  <button onClick={() => handleMoveSubCategory(sub.id, 'up')} disabled={idx === 0} className="text-slate-300 hover:text-slate-500 disabled:opacity-30 disabled:cursor-default" title="Move up">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => handleMoveSubCategory(sub.id, 'down')} disabled={idx === subCategories.length - 1} className="text-slate-300 hover:text-slate-500 disabled:opacity-30 disabled:cursor-default" title="Move down">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button onClick={() => openEditSubCategory(sub)} className="text-slate-400 hover:text-emerald-600" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDeleteSubCategory(sub.id)} className="text-slate-400 hover:text-red-500" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
