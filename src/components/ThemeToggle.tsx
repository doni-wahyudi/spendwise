import { useStore } from '../store/useStore';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, setTheme } = useStore();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <section className="settings-section">
            <div className="section-header">
                <h3>
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    <span style={{ marginLeft: 8 }}>Appearance</span>
                </h3>
            </div>
            <div className="theme-toggle-wrapper">
                <span>Theme</span>
                <button onClick={toggleTheme} className="theme-toggle-btn">
                    <span className={`toggle-option ${theme === 'light' ? 'active' : ''}`}>
                        <Sun size={14} /> Light
                    </span>
                    <span className={`toggle-option ${theme === 'dark' ? 'active' : ''}`}>
                        <Moon size={14} /> Dark
                    </span>
                </button>
            </div>
        </section>
    );
}
