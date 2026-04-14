'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadHistory();
    }
  }, [status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const history = await res.json();
        if (history.length > 0) {
          setMessages(
            history.map((h: { id: string; role: string; content: string; createdAt: string }) => ({
              id: h.id,
              role: h.role as 'user' | 'assistant',
              content: h.content,
              timestamp: new Date(h.createdAt),
            }))
          );
        } else {
          setMessages([
            {
              id: '1',
              role: 'assistant',
              content: 'Halo! Saya asisten AI Anda. Ada yang bisa saya bantu hari ini?',
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Halo! Saya asisten AI Anda. Ada yang bisa saya bantu hari ini?',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (res.ok) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error || 'Terjadi kesalahan. Silakan coba lagi.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Terjadi kesalahan koneksi. Silakan coba lagi.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (status === 'loading' || loadingHistory) {
    return <div className={styles.loading}>Memuat...</div>;
  }

  const userRole = (session?.user as { role?: string })?.role;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>AI Chatbot</h1>
        </div>
        <div className={styles.headerRight}>
          {userRole === 'ADMIN' && (
            <Link href="/admin/users" className={styles.adminLink}>
              Manajemen User
            </Link>
          )}
          <span className={styles.userInfo}>
            {session?.user?.name}
          </span>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className={styles.logoutBtn}>
            Keluar
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.chatContainer}>
          <div className={styles.messages}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
              >
                <div className={styles.messageContent}>
                  {msg.content}
                </div>
                <div className={styles.messageTime}>
                  {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {loading && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.messageContent}>
                  <span className={styles.typing}>Mengetik...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputArea}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ketik pesan Anda..."
              className={styles.input}
              rows={1}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} className={styles.sendBtn}>
              Kirim
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}