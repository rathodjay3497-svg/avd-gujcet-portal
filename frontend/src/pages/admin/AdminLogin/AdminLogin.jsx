import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button/Button';
import styles from './AdminLogin.module.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { adminLogin, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await adminLogin(username, password);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoBox}>
          <span className={styles.logoIcon}>GC</span>
        </div>
        <h2 className={styles.title}>Admin Login</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={styles.input}
            />
          </div>
          <Button type="submit" fullWidth loading={loading} size="lg">
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
