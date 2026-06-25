import { useStore } from '../store/useStore';

export default function LanguageToggle() {
    const { language, setLanguage } = useStore();

    return (
        <section className="settings-section">
            <div className="section-header">
                <h3>🌐 Language / Bahasa</h3>
            </div>
            <div className="theme-toggle-wrapper">
                <span>{language === 'id' ? 'Bahasa' : 'Language'}</span>
                <button onClick={() => setLanguage(language === 'id' ? 'en' : 'id')} className="theme-toggle-btn">
                    <span className={`toggle-option ${language === 'id' ? 'active' : ''}`}>
                        🇮🇩 ID
                    </span>
                    <span className={`toggle-option ${language === 'en' ? 'active' : ''}`}>
                        🇬🇧 EN
                    </span>
                </button>
            </div>
        </section>
    );
}
