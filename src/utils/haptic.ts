// Haptic Feedback Utility
// Uses the Vibration API for mobile devices

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: 50,
    success: [15, 50, 15],
    warning: [30, 50, 30],
    error: [50, 30, 50, 30, 50]
};

export function hapticFeedback(type: HapticType = 'light'): void {
    // Check if vibration is supported
    if (!('vibrate' in navigator)) {
        return;
    }

    // Check if user has enabled haptic feedback
    const hapticEnabled = localStorage.getItem('spendwise-haptic-enabled');
    if (hapticEnabled === 'false') {
        return;
    }

    try {
        const pattern = HAPTIC_PATTERNS[type];
        navigator.vibrate(pattern);
    } catch (e) {
        // Silently fail if vibration is not available
        console.debug('Haptic feedback not available');
    }
}

// Convenience wrappers
export const haptic = {
    tap: () => hapticFeedback('light'),
    press: () => hapticFeedback('medium'),
    impact: () => hapticFeedback('heavy'),
    success: () => hapticFeedback('success'),
    warning: () => hapticFeedback('warning'),
    error: () => hapticFeedback('error')
};

// Hook for haptic settings
export function isHapticEnabled(): boolean {
    const stored = localStorage.getItem('spendwise-haptic-enabled');
    return stored !== 'false'; // Default to true
}

export function setHapticEnabled(enabled: boolean): void {
    localStorage.setItem('spendwise-haptic-enabled', enabled.toString());
}
