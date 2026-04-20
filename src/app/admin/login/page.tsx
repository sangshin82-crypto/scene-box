'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

const BLUE = "#2563EB";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    setIsLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    router.push('/admin');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>

        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: '#111827', letterSpacing: '-1px' }}>
            Scene<span style={{ color: BLUE }}>Box</span>
          </span>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 6 }}>관리자 로그인</p>
        </div>

        {/* 로그인 폼 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>이메일</label>
            <input
              type="email"
              placeholder="관리자 이메일"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 16, textAlign: 'center' }}>{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: isLoading ? '#E5E7EB' : BLUE, color: isLoading ? '#9CA3AF' : '#fff', fontSize: 15, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  );
}