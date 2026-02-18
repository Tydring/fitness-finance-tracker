import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import './SyncStatusButton.css';

/**
 * Header sync button — shows pending/conflict badge and triggers manual sync.
 * Reads its own state from useSyncStatus (one Firestore subscription per mount).
 */
const SyncStatusButton = () => {
    const { pending, conflicts, syncing, syncError, syncNow } = useSyncStatus();

    const hasConflict = conflicts > 0;
    const hasPending = pending > 0;
    const count = hasConflict ? conflicts : pending;
    const showBadge = (hasConflict || hasPending) && !syncing;

    const label = syncing
        ? 'Syncing…'
        : hasConflict
        ? `${conflicts} conflict${conflicts !== 1 ? 's' : ''}`
        : hasPending
        ? `${pending} pending`
        : syncError
        ? 'Sync error'
        : 'All synced';

    return (
        <div className="sync-btn-wrap" title={label}>
            <button
                className={`btn-icon sync-btn ${syncing ? 'syncing' : ''} ${hasConflict ? 'has-conflict' : ''}`}
                onClick={syncNow}
                disabled={syncing}
                aria-label={label}
            >
                {hasConflict && !syncing
                    ? <AlertCircle size={18} />
                    : !syncing && !hasPending
                    ? <CheckCircle2 size={18} className="sync-ok" />
                    : <RefreshCw size={18} className={syncing ? 'spinning' : ''} />
                }
            </button>
            {showBadge && (
                <span className={`sync-count-badge ${hasConflict ? 'conflict' : 'pending'}`}>
                    {count}
                </span>
            )}
        </div>
    );
};

export default SyncStatusButton;
