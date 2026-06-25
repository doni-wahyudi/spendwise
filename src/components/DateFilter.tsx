import { useStore } from '../store/useStore';
import { type FilterType } from '../utils/dateUtils';
import { Calendar, ChevronDown, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';

const FILTER_OPTIONS: { value: FilterType; label: string; icon?: React.ReactNode }[] = [
    { value: 'salary', label: 'Salary Period', icon: <Briefcase size={14} /> },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom Range' },
];

export default function DateFilter() {
    const { dateFilterType, dateRange, setDateFilter, salaryDay } = useStore();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCustom, setShowCustom] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // Update salary period when salaryDay changes
    useEffect(() => {
        if (dateFilterType === 'salary') {
            setDateFilter('salary');
        }
    }, [salaryDay]);

    const handleFilterChange = (filterType: FilterType) => {
        if (filterType === 'custom') {
            setShowCustom(true);
            setShowDropdown(false);
        } else {
            setDateFilter(filterType);
            setShowDropdown(false);
            setShowCustom(false);
        }
    };

    const handleCustomApply = () => {
        if (customStart && customEnd) {
            setDateFilter('custom', customStart, customEnd);
            setShowCustom(false);
        }
    };

    const currentLabel = FILTER_OPTIONS.find(o => o.value === dateFilterType)?.label || 'This Month';

    return (
        <div className="date-filter">
            <button
                className="date-filter-btn"
                onClick={() => setShowDropdown(!showDropdown)}
            >
                <Calendar size={16} />
                <span>{currentLabel}</span>
                <ChevronDown size={16} />
            </button>

            {showDropdown && (
                <div className="date-filter-dropdown">
                    {FILTER_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            className={`filter-option ${dateFilterType === option.value ? 'active' : ''}`}
                            onClick={() => handleFilterChange(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}

            {showCustom && (
                <div className="custom-range-picker">
                    <div className="custom-range-inputs">
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            placeholder="Start Date"
                        />
                        <span>to</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            placeholder="End Date"
                        />
                    </div>
                    <div className="custom-range-actions">
                        <button onClick={() => setShowCustom(false)} className="cancel-btn">Cancel</button>
                        <button onClick={handleCustomApply} className="apply-btn">Apply</button>
                    </div>
                </div>
            )}

            {dateFilterType !== 'all' && (
                <span className="date-range-label">
                    {dateRange.startDate} — {dateRange.endDate}
                </span>
            )}
        </div>
    );
}
