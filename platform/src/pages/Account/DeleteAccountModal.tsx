import { useState } from 'react';
import { Modal } from '../../components/ui/Modal/Modal';
import { Button } from '../../components/ui/Button/Button';
import styles from '../../components/ui/Modal/ModalForm.module.css';

type Props = {
  userEmail: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
  error: string;
};

function DeleteAccountModal({ userEmail, onConfirm, onClose, loading, error }: Props) {
  const [emailInput, setEmailInput] = useState('');
  const emailMatches = emailInput === userEmail;

  return (
    <Modal isOpen={true} onClose={onClose} title="Delete account">
      <p className={styles.field}>
        If you delete this account, <strong>all your sites, widgets, and data will be permanently deleted.</strong> This action cannot be undone.
      </p>
      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Enter your email to confirm</label>
          <input
            className={styles.input}
            type="email"
            placeholder={userEmail}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <Button type="button" variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={!emailMatches || loading}
          >
            {loading ? 'Deleting...' : 'Confirm delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteAccountModal;