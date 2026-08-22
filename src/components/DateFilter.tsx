import { useStore } from '../store/useStore';
import { type FilterType } from '../utils/dateUtils';
import { Calendar, ChevronDown, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';
import { t } from '../i18n/translations';

export default function DateFilter() {
    const { dateFilterType, dateRange, setDateFilter, salaryDay, language } = useStore();
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

    const filterOptions: { value: FilterType; label: string; icon?: React.ReactNode }[] = [
        { value: 'salary', label: `${t(language, 'salary')} ${t(language, 'customPeriod')}`, icon: <Briefcase size={14} /> },
        { value: 'week', label: t(language, 'weekly') },
        { value: 'month', label: t(language, 'thisMonth') },
        { value: 'lastMonth', label: t(language, 'lastMonth') },
        { value: '3months', label: language === 'id' ? '3 Bulan Terakhir' : 'Last 3 Months' },
        { value: 'year', label: language === 'id' ? 'Tahun Ini' : 'This Year' },
        { value: 'all', label: t(language, 'allTime') },
        { value: 'custom', label: t(language, 'customRange') },
    ];

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

    const currentLabel = filterOptions.find(o => o.value === dateFilterType)?.label || t(language, 'thisMonth');

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
                    {filterOptions.map(option => (
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
                            placeholder={t(language, 'startDate')}
                        />
                        <span>–</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            placeholder={t(language, 'endDate')}
                        />
                    </div>
                    <div className="custom-range-actions">
                        <button onClick={() => setShowCustom(false)} className="cancel-btn">{t(language, 'cancel')}</button>
                        <button onClick={handleCustomApply} className="apply-btn">{t(language, 'apply')}</button>
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
