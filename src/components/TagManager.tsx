import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useToast } from '../store/useToast';
import { Tag, Plus, Trash2 } from 'lucide-react';

export default function TagManager() {
    const { addToast } = useToast();
    const [newTag, setNewTag] = useState('');

    // Get all tags from the tags table
    const allTags = useLiveQuery(() => db.tags.toArray(), []);

    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newTag.trim().toLowerCase();
        if (!trimmed) return;

        // Check if tag already exists
        const existing = await db.tags.where('name').equals(trimmed).first();
        if (existing) {
            addToast('Tag already exists', 'error');
            return;
        }

        // Add to tags table (not to transactions)
        await db.tags.add({
            name: trimmed,
            createdAt: Date.now()
        });

        setNewTag('');
        addToast('Tag created!', 'success');
    };

    const handleRenameTag = async (oldName: string, tagId: number) => {
        const newName = prompt(`Rename tag "${oldName}" to:`, oldName);
        if (!newName || newName === oldName) return;

        const trimmed = newName.trim().toLowerCase();

        // Check if new name already exists
        const existing = await db.tags.where('name').equals(trimmed).first();
        if (existing) {
            addToast('Tag already exists', 'error');
            return;
        }

        // Update tag name in tags table
        await db.tags.update(tagId, { name: trimmed });

        // Update all transactions that use this tag
        const allTransactions = await db.transactions.toArray();
        const affectedTxs = allTransactions.filter(tx => tx.tags?.includes(oldName));

        for (const tx of affectedTxs) {
            const newTags = tx.tags?.map(t => t === oldName ? trimmed : t) || [];
            await db.transactions.update(tx.id, { tags: newTags });
        }

        addToast(`Renamed "${oldName}" to "${trimmed}"`, 'success');
    };

    const handleDeleteTag = async (tagName: string, tagId: number) => {
        // Check how many transactions use this tag
        const allTransactions = await db.transactions.toArray();
        const affectedTxs = allTransactions.filter(tx => tx.tags?.includes(tagName));

        if (!confirm(`Delete tag "${tagName}"? It will be removed from ${affectedTxs.length} transactions.`)) return;

        // Remove from all transactions
        for (const tx of affectedTxs) {
            const newTags = tx.tags?.filter(t => t !== tagName) || [];
            await db.transactions.update(tx.id, { tags: newTags.length > 0 ? newTags : undefined });
        }

        // Delete from tags table
        await db.tags.delete(tagId);

        addToast(`Deleted tag "${tagName}"`, 'info');
    };

    if (!allTags) {
        return <div className="skeleton" style={{ height: 100 }} />;
    }

    return (
        <section className="settings-section tag-manager">
            <div className="section-header">
                <h3><Tag size={16} /> Tags</h3>
            </div>

            <p className="settings-description">Manage tags for organizing transactions.</p>

            <form onSubmit={handleAddTag} className="add-tag-form">
                <input
                    type="text"
                    placeholder="New tag name..."
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                />
                <button type="submit" className="add-btn">
                    <Plus size={16} /> Add
                </button>
            </form>

            {allTags.length === 0 ? (
                <p className="empty-message">No tags yet. Create tags to organize transactions.</p>
            ) : (
                <ul className="tag-list">
                    {allTags.map(tag => (
                        <li key={tag.id} className="tag-item">
                            <span className="tag-name">#{tag.name}</span>
                            <div className="tag-actions">
                                <button onClick={() => handleRenameTag(tag.name, tag.id!)} className="rename-btn" title="Rename">
                                    Rename
                                </button>
                                <button onClick={() => handleDeleteTag(tag.name, tag.id!)} className="delete-btn" title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
