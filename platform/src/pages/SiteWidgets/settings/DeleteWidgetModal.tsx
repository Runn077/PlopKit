import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import styles from './DeleteWidgetModal.module.css';

interface Props {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteWidgetModal({ onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Delete widget">
      <p className={styles.body}>
        This will permanently delete the widget and all its comments.
      </p>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <Button type="button" variant="light" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="danger" onClick={handleConfirm} disabled={loading}>
          {loading ? 'Deleting...' : 'Confirm delete'}
        </Button>
      </div>
    </Modal>
  );
}

export default DeleteWidgetModal;