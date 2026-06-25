import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { X, Tag } from 'lucide-react';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
}

export default function TagInput({ value, onChange }: TagInputProps) {
    // Get all tags from the tags table
    const allTags = useLiveQuery(() => db.tags.toArray(), []);

    const addTag = (tag: string) => {
        if (tag && !value.includes(tag)) {
            onChange([...value, tag]);
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    // Available tags (not already selected)
    const availableTags = allTags?.filter(t => !value.includes(t.name)).map(t => t.name) || [];

    return (
        <div className="tag-input-container">
            <label className="tag-input-label">
                <Tag size={14} /> Tags
            </label>

            {/* Selected Tags */}
            {value.length > 0 && (
                <div className="selected-tags">
                    {value.map(tag => (
                        <span key={tag} className="tag-chip">
                            #{tag}
                            <button type="button" onClick={() => removeTag(tag)} className="tag-remove">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Tag Dropdown */}
            <select
                className="tag-select"
                value=""
                onChange={(e) => {
                    if (e.target.value) {
                        addTag(e.target.value);
                    }
                }}
            >
                <option value="">
                    {availableTags.length > 0 ? 'Select a tag...' : (allTags?.length === 0 ? 'No tags - create in Settings' : 'All tags selected')}
                </option>
                {availableTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                ))}
            </select>

            {allTags?.length === 0 && (
                <p className="tag-hint">Create tags in Settings → Categories tab</p>
            )}
        </div>
    );
}
