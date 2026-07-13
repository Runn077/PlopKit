import { useState, useEffect, useRef } from 'react';
import type { SyntheticEvent } from 'react';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import styles from './AddSiteModal.module.css';

interface Props {
  onClose: () => void;
  onSubmit: (name: string, domain: string) => Promise<void>;
}

function AddSiteModal({ onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
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
      await onSubmit(name, domain);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Add a website">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Website name</label>
          <input
            ref={nameRef}
            className={styles.input}
            placeholder="really cool website"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Domain</label>
          <input
            className={styles.input}
            placeholder="mywebsite.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <Button type="submit" variant="dark" disabled={loading}>
            {loading ? 'Adding...' : 'Add website'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddSiteModal;