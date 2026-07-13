import { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import styles from './DeleteSiteModal.module.css';

interface Props {
  siteName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteSiteModal({ siteName, onClose, onConfirm }: Props) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Delete site">
      <p className={styles.body}>
        This will permanently delete the site and all its widgets and comments. Type <strong>{siteName}</strong> to confirm.
      </p>
      <div className={styles.form}>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder={siteName}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="danger"
            disabled={value !== siteName || loading}
            onClick={handleConfirm}
          >
            {loading ? 'Deleting...' : 'Confirm delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteSiteModal;