import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import styles from './ImportSiteModal.module.css';

interface Props {
  onClose: () => void;
  onSubmit: (name: string, domain: string, data: unknown) => Promise<void>;
}

function ImportSiteModal({ onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError('');
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Please select an export file');
      return;
    }
    setLoading(true);
    try {
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("That file isn't valid JSON");
      }
      await onSubmit(name, domain, data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Import a website">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Website name</label>
          <input
            ref={nameRef}
            className={styles.input}
            placeholder="really cool website"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
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
        <div className={styles.field}>
          <label className={styles.label}>Export file</label>
          <input
            className={styles.input}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            required
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <Button type="submit" variant="dark" disabled={loading}>
            {loading ? 'Importing...' : 'Import website'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ImportSiteModal;