import { useStore } from '../store/useStore';

const LANGUAGES = [
    {
        code: 'id' as const,
        label: 'Indonesia',
        nativeLabel: 'Bahasa Indonesia',
        flag: '🇮🇩',
        description: 'Tampilan dalam Bahasa Indonesia',
    },
    {
        code: 'en' as const,
        label: 'English',
        nativeLabel: 'English (US)',
        flag: '🇬🇧',
        description: 'Display in English',
    },
];

export default function LanguageToggle() {
    const { language, setLanguage } = useStore();

    return (
        <section className="settings-section lang-section">
            <div className="lang-section-header">
                <div className="lang-section-icon">🌐</div>
                <div>
                    <h3 className="lang-section-title">Language / Bahasa</h3>
                    <p className="lang-section-sub">
                        {language === 'id' ? 'Pilih bahasa tampilan aplikasi' : 'Choose your display language'}
                    </p>
                </div>
            </div>

            <div className="lang-option-grid">
                {LANGUAGES.map((lang) => {
                    const isActive = language === lang.code;
                    return (
                        <button
                            key={lang.code}
                            className={`lang-option-card ${isActive ? 'lang-option-active' : ''}`}
                            onClick={() => setLanguage(lang.code)}
                            aria-pressed={isActive}
                        >
                            <span className="lang-flag" role="img" aria-label={lang.label}>
                                {lang.flag}
                            </span>
                            <span className="lang-name">{lang.nativeLabel}</span>
                            <span className="lang-desc">{lang.description}</span>
                            {isActive && (
                                <span className="lang-active-badge">
                                    ✓ Active
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
