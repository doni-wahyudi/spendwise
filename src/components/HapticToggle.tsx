import { useState, useEffect } from 'react';
import { Vibrate } from 'lucide-react';
import { isHapticEnabled, setHapticEnabled, haptic } from '../utils/haptic';
import { useStore } from '../store/useStore';
import { t } from '../i18n/translations';

export default function HapticToggle() {
    const [enabled, setEnabled] = useState(true);
    const { language } = useStore();

    useEffect(() => {
        setEnabled(isHapticEnabled());
    }, []);

    const handleToggle = () => {
        const newValue = !enabled;
        setEnabled(newValue);
        setHapticEnabled(newValue);
        if (newValue) haptic.success();
    };

    const supportsVibration = 'vibrate' in navigator;
    if (!supportsVibration) return null;

    return (
        <section className="settings-section haptic-toggle">
            <div className="toggle-row">
                <div className="toggle-info">
                    <Vibrate size={18} />
                    <div>
                        <span className="toggle-label">{t(language, 'hapticFeedback')}</span>
                        <span className="toggle-description">{t(language, 'vibrationOnTouch')}</span>
                    </div>
                </div>
                <button
                    onClick={handleToggle}
                    className={`toggle-switch ${enabled ? 'active' : ''}`}
                    aria-label={t(language, 'hapticFeedback')}
                >
                    <span className="toggle-knob" />
                </button>
            </div>
        </section>
    );
}
