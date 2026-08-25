import { useState, useRef, useEffect } from 'react';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useStore } from '../store/useStore';
import {
    Cloud,
    CloudOff,
    Check,
    RefreshCw,
    WifiOff,
    AlertCircle,
    X,
    Database,
    LogIn,
    ArrowRight
} from 'lucide-react';
import { t } from '../i18n/translations';

interface SyncStatusBadgeProps {
    onOpenSettings?: () => void;
}

export default function SyncStatusBadge({ onOpenSettings }: SyncStatusBadgeProps) {
    const {
        pendingCount,
        isOnline,
        isSyncing,
        lastSyncTime,
        user,
        syncNow
    } = useSyncStatus();

    const { language } = useStore();
    const [showModal, setShowModal] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on click outside if modal is open
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setShowModal(false);
            }
        };
        if (showModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showModal]);

    // Format last sync time nicely
    const formattedLastSync = lastSyncTime
        ? new Date(lastSyncTime).toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
          })
        : null;

    // Get badge visual styling
    const renderBadge = () => {
        if (isSyncing) {
            return (
                <button
                    className="sync-badge syncing"
                    onClick={() => setShowModal(true)}
                    title={t(language, 'syncing')}
                >
                    <RefreshCw size={13} className="spin" />
                    <span className="sync-badge-text">{t(language, 'syncing')}</span>
                </button>
            );
        }

        if (!isOnline) {
            return (
                <button
                    className="sync-badge offline"
                    onClick={() => setShowModal(true)}
                    title={t(language, 'offlineMode')}
                >
                    <WifiOff size={13} />
                    <span className="sync-badge-text">Offline</span>
                    {pendingCount > 0 && <span className="sync-count-pill">{pendingCount}</span>}
                </button>
            );
        }

        if (pendingCount > 0) {
            return (
                <button
                    className="sync-badge pending"
                    onClick={() => setShowModal(true)}
                    title={`${pendingCount} ${t(language, 'recordsUnsynced')}`}
                >
                    <CloudOff size={13} />
                    <span className="sync-badge-text">
                        {pendingCount} {language === 'id' ? 'belum sync' : 'unsynced'}
                    </span>
                    <span className="sync-count-pill warning">{pendingCount}</span>
                </button>
            );
        }

        if (user) {
            return (
                <button
                    className="sync-badge synced"
                    onClick={() => setShowModal(true)}
                    title={t(language, 'allSynced')}
                >
                    <Check size={13} />
                    <Cloud size={13} />
                    <span className="sync-badge-text">{t(language, 'allSynced')}</span>
                </button>
            );
        }

        return (
            <button
                className="sync-badge local"
                onClick={() => setShowModal(true)}
                title={t(language, 'notSignedIn')}
            >
                <Cloud size={13} />
                <span className="sync-badge-text">{language === 'id' ? 'Lokal' : 'Local'}</span>
            </button>
        );
    };

    return (
        <div className="sync-badge-container">
            {renderBadge()}

            {showModal && (
                <div className="modal-overlay sync-modal-overlay">
                    <div className="modal-content sync-detail-modal" ref={modalRef}>
                        <div className="modal-header">
                            <h3>
                                <Cloud size={18} /> {t(language, 'syncDetails')}
                            </h3>
                            <button onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="sync-detail-body">
                            {/* User Account / Connection State */}
                            <div className="sync-info-card">
                                <div className="sync-info-row">
                                    <span className="sync-info-label">
                                        {language === 'id' ? 'Akun Cloud:' : 'Cloud Account:'}
                                    </span>
                                    <span className="sync-info-val highlight">
                                        {user ? user.email : (language === 'id' ? 'Belum Masuk' : 'Not Signed In')}
                                    </span>
                                </div>
                                <div className="sync-info-row">
                                    <span className="sync-info-label">
                                        {language === 'id' ? 'Koneksi:' : 'Connection:'}
                                    </span>
                                    <span className={`sync-info-val ${isOnline ? 'online' : 'offline'}`}>
                                        {isOnline ? '🟢 Online' : '🔴 Offline'}
                                    </span>
                                </div>
                                {formattedLastSync && (
                                    <div className="sync-info-row">
                                        <span className="sync-info-label">{t(language, 'lastSynced')}:</span>
                                        <span className="sync-info-val">{formattedLastSync}</span>
                                    </div>
                                )}
                            </div>

                            {/* Sync Status Status Box */}
                            <div className={`sync-status-box ${pendingCount > 0 ? 'warning' : user ? 'success' : 'info'}`}>
                                {isSyncing ? (
                                    <div className="sync-status-text">
                                        <RefreshCw size={20} className="spin icon-sync" />
                                        <div>
                                            <strong>{t(language, 'syncing')}</strong>
                                            <p>{language === 'id' ? 'Sedang menghubungkan ke Supabase...' : 'Connecting to Supabase...'}</p>
                                        </div>
                                    </div>
                                ) : pendingCount > 0 ? (
                                    <div className="sync-status-text">
                                        <AlertCircle size={20} className="icon-warning" />
                                        <div>
                                            <strong>
                                                {pendingCount} {t(language, 'recordsUnsynced')}
                                            </strong>
                                            <p>
                                                {language === 'id'
                                                    ? 'Catatan tersimpan aman di perangkat dan akan disinkronkan saat online.'
                                                    : 'Records are stored safely on your device and will sync when online.'}
                                            </p>
                                        </div>
                                    </div>
                                ) : user ? (
                                    <div className="sync-status-text">
                                        <Check size={20} className="icon-success" />
                                        <div>
                                            <strong>{t(language, 'allSynced')}</strong>
                                            <p>
                                                {language === 'id'
                                                    ? 'Semua data di perangkat cocok dengan database cloud.'
                                                    : 'All device data matches the cloud database.'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="sync-status-text">
                                        <Database size={20} className="icon-info" />
                                        <div>
                                            <strong>{language === 'id' ? 'Mode Offline / Lokal' : 'Offline / Local Mode'}</strong>
                                            <p>
                                                {language === 'id'
                                                    ? 'Data disimpan secara lokal di browser. Masuk untuk mengaktifkan sinkronisasi otomatis multi-perangkat.'
                                                    : 'Data is stored locally in browser. Sign in to enable multi-device cloud sync.'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="sync-modal-actions">
                                {user ? (
                                    <button
                                        type="button"
                                        className="sync-action-btn primary"
                                        onClick={() => syncNow(true)}
                                        disabled={isSyncing || !isOnline}
                                    >
                                        <RefreshCw size={15} className={isSyncing ? 'spin' : ''} />
                                        <span>{isSyncing ? t(language, 'syncing') : t(language, 'syncNow')}</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="sync-action-btn primary"
                                        onClick={() => {
                                            setShowModal(false);
                                            onOpenSettings?.();
                                        }}
                                    >
                                        <LogIn size={15} />
                                        <span>{t(language, 'openCloudSettings')}</span>
                                        <ArrowRight size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
