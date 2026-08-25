import { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, TrendingUp, X, Search } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export interface NoteHistoryItem {
    note: string;
    count: number;
    lastUsed: string;
    lastAmount: number;
    categoryId: number;
    categoryName?: string;
    categoryColor?: string;
}

interface NoteAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelectSuggestion?: (item: NoteHistoryItem) => void;
    history: NoteHistoryItem[];
    placeholder?: string;
    language?: 'id' | 'en';
}

/** Compute fuzzy match score between query and text (0 = no match, >0 = matched) */
function fuzzyScore(query: string, text: string): number {
    if (!query) return 1;
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t === q) return 100;
    if (t.startsWith(q)) return 90;
    if (t.includes(q)) return 70;

    // Character-by-character fuzzy check
    let qi = 0;
    let consecutiveBonus = 0;
    let score = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) {
            score += 10 + consecutiveBonus;
            consecutiveBonus += 2;
            qi++;
        } else {
            consecutiveBonus = 0;
        }
    }
    return qi === q.length ? score : 0;
}

/** Highlight matching characters in a suggestion label */
function HighlightMatch({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <span>{text}</span>;

    const q = query.toLowerCase();
    const t = text.toLowerCase();
    const startIdx = t.indexOf(q);

    if (startIdx === -1) return <span>{text}</span>;

    return (
        <span>
            {text.slice(0, startIdx)}
            <mark className="note-match-highlight">{text.slice(startIdx, startIdx + q.length)}</mark>
            {text.slice(startIdx + q.length)}
        </span>
    );
}

export default function NoteAutocomplete({
    value,
    onChange,
    onSelectSuggestion,
    history,
    placeholder,
    language = 'id',
}: NoteAutocompleteProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Compute filtered suggestions from history based on current input
    const suggestions = useMemo<NoteHistoryItem[]>(() => {
        const query = value.trim();

        return history
            .map(item => ({ item, score: fuzzyScore(query, item.note) }))
            .filter(({ score, item }) => {
                // When no query typed, show most-used (top 8)
                if (!query) return true;
                // When query exists, filter by fuzzy score
                return score > 0 && item.note.toLowerCase() !== query.toLowerCase();
            })
            .sort((a, b) => {
                if (!value.trim()) {
                    // Sort by usage count desc when no query
                    return b.item.count - a.item.count;
                }
                // Sort by fuzzy score desc, then count desc
                return b.score - a.score || b.item.count - a.item.count;
            })
            .slice(0, 8)
            .map(({ item }) => item);
    }, [value, history]);

    const showDropdown = isFocused && suggestions.length > 0;

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsFocused(false);
                setActiveIdx(-1);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Reset active index when suggestions change
    useEffect(() => {
        setActiveIdx(-1);
    }, [suggestions.length]);

    const handleSelect = (item: NoteHistoryItem) => {
        onChange(item.note);
        onSelectSuggestion?.(item);
        setIsFocused(false);
        setActiveIdx(-1);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, -1));
        } else if (e.key === 'Enter' && activeIdx >= 0) {
            e.preventDefault();
            handleSelect(suggestions[activeIdx]);
        } else if (e.key === 'Escape') {
            setIsFocused(false);
            setActiveIdx(-1);
        }
    };

    // Scroll active item into view
    useEffect(() => {
        if (activeIdx >= 0 && listRef.current) {
            const item = listRef.current.children[activeIdx] as HTMLElement;
            item?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIdx]);

    return (
        <div className="note-autocomplete-wrapper" ref={containerRef}>
            <div className="note-input-row">
                <Search size={14} className="note-search-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    className="note-autocomplete-input"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || (language === 'id' ? 'Catatan (Opsional)' : 'Note (Optional)')}
                    autoComplete="off"
                />
                {value && (
                    <button
                        type="button"
                        className="note-clear-btn"
                        onClick={() => { onChange(''); inputRef.current?.focus(); }}
                        tabIndex={-1}
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {showDropdown && (
                <ul className="note-suggestions-dropdown" ref={listRef} role="listbox">
                    <li className="note-suggestions-header">
                        {value.trim()
                            ? (language === 'id' ? '🔍 Riwayat cocok' : '🔍 Matching history')
                            : (language === 'id' ? '⚡ Sering digunakan' : '⚡ Frequently used')}
                    </li>
                    {suggestions.map((item, i) => (
                        <li
                            key={item.note}
                            className={`note-suggestion-item ${i === activeIdx ? 'active' : ''}`}
                            onMouseDown={() => handleSelect(item)}
                            onMouseEnter={() => setActiveIdx(i)}
                            role="option"
                            aria-selected={i === activeIdx}
                        >
                            <div className="note-suggestion-left">
                                {item.count >= 3
                                    ? <TrendingUp size={13} className="note-sug-icon trending" />
                                    : <Clock size={13} className="note-sug-icon" />
                                }
                                <span className="note-sug-text">
                                    <HighlightMatch text={item.note} query={value} />
                                </span>
                            </div>
                            <div className="note-suggestion-right">
                                {item.categoryName && (
                                    <span
                                        className="note-sug-cat"
                                        style={{ color: item.categoryColor, backgroundColor: `${item.categoryColor}18` }}
                                    >
                                        {item.categoryName}
                                    </span>
                                )}
                                <span className="note-sug-amount">{formatCurrency(item.lastAmount)}</span>
                                <span className="note-sug-count">{item.count}×</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
