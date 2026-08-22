import { useStore } from '../store/useStore';
import { Sun, Moon } from 'lucide-react';
import { t } from '../i18n/translations';

export default function ThemeToggle() {
    const { theme, setTheme, language } = useStore();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <section className="settings-section">
            <div className="section-header">
                <h3>
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    <span style={{ marginLeft: 8 }}>{t(language, 'appearance')}</span>
                </h3>
            </div>
            <div className="theme-toggle-wrapper">
                <span>{t(language, 'theme')}</span>
                <button onClick={toggleTheme} className="theme-toggle-btn">
                    <span className={`toggle-option ${theme === 'light' ? 'active' : ''}`}>
                        <Sun size={14} /> {t(language, 'light')}
                    </span>
                    <span className={`toggle-option ${theme === 'dark' ? 'active' : ''}`}>
                        <Moon size={14} /> {t(language, 'dark')}
                    </span>
                </button>
            </div>
        </section>
    );
}
