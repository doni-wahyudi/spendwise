import { useToast } from '../store/useToast';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />
};

export default function Toast() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <span className="toast-icon">{icons[toast.type]}</span>
                    <span className="toast-message">{toast.message}</span>
                    <button onClick={() => removeToast(toast.id)} className="toast-close">
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
