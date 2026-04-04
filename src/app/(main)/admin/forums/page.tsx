"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type ForumCategory = Tables<"forum_categories">;

export default function AdminForumsPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadCategories() {
    const { data } = await supabase
      .from("forum_categories")
      .select("*")
      .order("name");
    setCategories(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(cat: ForumCategory) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditDescription(cat.description ?? "");
    setError("");
  }

  async function saveEdit() {
    if (!editName.trim() || !editSlug.trim()) {
      setError("Name and slug are required.");
      return;
    }
    setActionLoading(true);
    const { error: updateError } = await supabase
      .from("forum_categories")
      .update({
        name: editName.trim(),
        slug: editSlug.trim(),
        description: editDescription.trim() || null,
      })
      .eq("id", editingId!);

    if (updateError) {
      setError(updateError.message);
    } else {
      setEditingId(null);
      await loadCategories();
    }
    setActionLoading(false);
  }

  async function handleCreate() {
    if (!newName.trim() || !newSlug.trim()) {
      setError("Name and slug are required.");
      return;
    }
    setActionLoading(true);
    setError("");
    const { error: insertError } = await supabase.from("forum_categories").insert({
      name: newName.trim(),
      slug: newSlug.trim(),
      description: newDescription.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setShowNewForm(false);
      setNewName("");
      setNewSlug("");
      setNewDescription("");
      await loadCategories();
    }
    setActionLoading(false);
  }

  async function handleDelete(id: string) {
    setActionLoading(true);
    await supabase.from("forum_categories").delete().eq("id", id);
    setDeleteConfirm(null);
    await loadCategories();
    setActionLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Forum Management</h1>
        <button
          onClick={() => {
            setShowNewForm(true);
            setError("");
          }}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium text-sm rounded transition-colors"
        >
          Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {showNewForm && (
        <div className="bg-navy-900 border border-teal-500/30 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">New Category</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Category name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                }}
                className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium text-xs rounded transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Create"}
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className="px-3 py-1.5 bg-navy-800 border border-navy-600 text-slate-400 text-xs rounded hover:text-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
          <p className="text-slate-400">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No forum categories yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4"
            >
              {editingId === cat.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description"
                    className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium text-xs rounded transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 bg-navy-800 border border-navy-600 text-slate-400 text-xs rounded hover:text-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-100">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-sm text-slate-400 mt-0.5">{cat.description}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      slug: {cat.slug} -- {(cat as Record<string, unknown>).post_count as number ?? 0} posts
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => startEdit(cat)}
                      className="text-xs px-2.5 py-1 rounded bg-navy-800 border border-navy-600 text-slate-400 hover:text-slate-100 transition-colors"
                    >
                      Edit
                    </button>
                    {deleteConfirm === cat.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={actionLoading}
                          className="text-xs px-2.5 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs px-2.5 py-1 rounded bg-navy-800 border border-navy-600 text-slate-400 hover:text-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(cat.id)}
                        className="text-xs px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
