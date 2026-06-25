import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, PieChart, Wallet, Target, Bell, Zap, Settings } from 'lucide-react';

interface OnboardingStep {
    title: string;
    description: string;
    icon: React.ReactNode;
}

const steps: OnboardingStep[] = [
    {
        title: 'Welcome to SpendWise! 👋',
        description: 'Track your income and expenses with ease. Let\'s take a quick tour of the main features.',
        icon: <PieChart size={48} />
    },
    {
        title: 'Add Transactions',
        description: 'Tap the "Add" tab to record income or expenses. Choose a category, enter the amount, and save!',
        icon: <Wallet size={48} />
    },
    {
        title: 'Set Savings Goals',
        description: 'Create goals in Settings to track progress toward your targets. Add funds anytime to see your progress!',
        icon: <Target size={48} />
    },
    {
        title: 'Bill Reminders',
        description: 'Never miss a bill! Set up reminders in Settings to get notified when bills are due.',
        icon: <Bell size={48} />
    },
    {
        title: 'Quick Templates',
        description: 'Save frequent transactions as templates for one-tap adding. Perfect for daily coffee or subscriptions!',
        icon: <Zap size={48} />
    },
    {
        title: 'You\'re All Set! 🎉',
        description: 'Explore Settings for more options like themes, reports, data export, and multi-language support.',
        icon: <Settings size={48} />
    }
];

export default function Onboarding() {
    const [currentStep, setCurrentStep] = useState(0);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('spendwise-onboarding-completed');
        if (!hasSeenOnboarding) {
            setShow(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem('spendwise-onboarding-completed', 'true');
        setShow(false);
    };

    const handleSkip = () => {
        handleComplete();
    };

    if (!show) return null;

    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-modal">
                <button className="onboarding-close" onClick={handleSkip}>
                    <X size={20} />
                </button>

                <div className="onboarding-icon">
                    {step.icon}
                </div>

                <h2 className="onboarding-title">{step.title}</h2>
                <p className="onboarding-description">{step.description}</p>

                <div className="onboarding-dots">
                    {steps.map((_, i) => (
                        <span
                            key={i}
                            className={`dot ${i === currentStep ? 'active' : ''}`}
                            onClick={() => setCurrentStep(i)}
                        />
                    ))}
                </div>

                <div className="onboarding-actions">
                    {currentStep > 0 && (
                        <button onClick={handlePrev} className="onboarding-btn secondary">
                            <ChevronLeft size={16} /> Back
                        </button>
                    )}
                    <button onClick={handleNext} className="onboarding-btn primary">
                        {isLast ? 'Get Started' : 'Next'}
                        {!isLast && <ChevronRight size={16} />}
                    </button>
                </div>

                {!isLast && (
                    <button className="onboarding-skip" onClick={handleSkip}>
                        Skip tour
                    </button>
                )}
            </div>
        </div>
    );
}
