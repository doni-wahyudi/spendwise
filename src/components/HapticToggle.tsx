import { useState, useEffect } from 'react';
import { Vibrate } from 'lucide-react';
import { isHapticEnabled, setHapticEnabled, haptic } from '../utils/haptic';

export default function HapticToggle() {
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        setEnabled(isHapticEnabled());
    }, []);

    const handleToggle = () => {
        const newValue = !enabled;
        setEnabled(newValue);
        setHapticEnabled(newValue);

        if (newValue) {
            haptic.success();
        }
    };

    // Check if device supports vibration
    const supportsVibration = 'vibrate' in navigator;

    if (!supportsVibration) {
        return null; // Don't show on devices without vibration support
    }

    return (
        <section className="settings-section haptic-toggle">
            <div className="toggle-row">
                <div className="toggle-info">
                    <Vibrate size={18} />
                    <div>
                        <span className="toggle-label">Haptic Feedback</span>
                        <span className="toggle-description">Vibration on touch actions</span>
                    </div>
                </div>
                <button
                    onClick={handleToggle}
                    className={`toggle-switch ${enabled ? 'active' : ''}`}
                    aria-label="Toggle haptic feedback"
                >
                    <span className="toggle-knob" />
                </button>
            </div>
        </section>
    );
}
