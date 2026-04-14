'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './users.module.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as { role?: string })?.role;
      if (userRole !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        fetchUsers();
      }
    }
  }, [status, session, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError('Gagal mengambil data user');
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, isActive: !currentStatus } : u
        ));
      }
    } catch (err) {
      setError('Gagal mengubah status user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (err) {
      setError('Gagal menghapus user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUser.name,
          role: editingUser.role,
        }),
      });

      if (res.ok) {
        setUsers(users.map(u => 
          u.id === editingUser.id ? editingUser : u
        ));
        setEditingUser(null);
      }
    } catch (err) {
      setError('Gagal memperbarui user');
    }
  };

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Memuat...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard" className={styles.backLink}>
            ← Kembali
          </Link>
          <h1>Manajemen User</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userInfo}>
            {session?.user?.name} (Admin)
          </span>
        </div>
      </header>

      <main className={styles.main}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.role} ${styles[user.role.toLowerCase()]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.status} ${user.isActive ? styles.active : styles.inactive}`}>
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('id-ID')}</td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        onClick={() => setEditingUser(user)}
                        className={styles.editBtn}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={user.isActive ? styles.deactivateBtn : styles.activateBtn}
                      >
                        {user.isActive ? 'Nonaktif' : 'Aktifkan'}
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className={styles.deleteBtn}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {editingUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Edit User</h2>
            <form onSubmit={handleUpdateUser}>
              <div className={styles.field}>
                <label>Nama</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input type="email" value={editingUser.email} disabled />
              </div>
              <div className={styles.field}>
                <label>Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setEditingUser(null)} className={styles.cancelBtn}>
                  Batal
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}