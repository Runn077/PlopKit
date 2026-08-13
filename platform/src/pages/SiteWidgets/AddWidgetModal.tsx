import { useState, useEffect, useRef } from 'react';
import type { SyntheticEvent } from 'react';
import { Modal } from '../../components/ui/Modal/Modal';
import { Button } from '../../components/ui/Button/Button';
import styles from './AddWidgetModal.module.css';

interface Props {
  onClose: () => void;
  onSubmit: (type: string, name: string) => Promise<void>;
}

function AddWidgetModal({ onClose, onSubmit }: Props) {
  const type = 'comments';
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(type, name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Add a comment widget">
      <form className={styles.form} onSubmit={handleSubmit}>
        <input type="hidden" value={type} />
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            ref={nameRef}
            className={styles.input}
            placeholder="e.g. page name"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <Button type="submit" variant="dark" disabled={loading}>
            {loading ? 'Adding...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddWidgetModal;