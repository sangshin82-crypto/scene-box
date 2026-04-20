'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

type AuthUser = {
  id: string;
  email: string;
  created_at: string;
};

export default function AdminSettings() {
  const router = useRouter();

  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [clientName, setClientName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredClients, setRegisteredClients] = useState<any[]>([]);

  // 등록된 고객 목록 불러오기
  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      setRegisteredClients(data ?? []);
    }
    fetchClients();
  }, []);

  const handleRegisterClient = async () => {
    if (!selectedUserId.trim() || !clientName.trim()) {
      alert('유저 ID와 고객사 이름을 모두 입력해주세요.');
      return;
    }
    setIsRegistering(true);

    const { error } = await supabase
      .from('clients')
      .insert({
        id:   selectedUserId.trim(),
        name: clientName.trim(),
      });

    if (error) {
      if (error.code === '23505') {
        alert('이미 등록된 유저 ID입니다.');
      } else {
        alert('등록 중 오류가 발생했습니다: ' + error.message);
      }
    } else {
      alert(`${clientName} 고객이 등록되었습니다! ✅`);
      setSelectedUserId('');
      setClientName('');
      // 목록 새로고침
      const { data } = await supabase.from('clients').select('id, name').order('name');
      setRegisteredClients(data ?? []);
    }
    setIsRegistering(false);
  };

  return (
    <div className="relative mx-auto w-full max-w-md min-h-screen bg-gray-50 pb-[100px] shadow-xl">

      {/* 헤더 */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">시스템 설정</h1>
      </div>

      <div className="p-4 space-y-5">

        {/* 고객 등록 섹션 */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 mb-2 ml-1">📋 고객 등록 (전화 상담 고객)</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <p className="text-xs text-gray-400 leading-5">
              고객이 카카오 로그인 후 생성된 유저 ID를 입력하세요.<br />
              유저 ID는 Supabase → Authentication → Users에서 확인할 수 있어요.
            </p>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">고객사 이름</label>
              <input
                type="text"
                placeholder="예: A프로덕션 미술팀"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">카카오 로그인 유저 ID</label>
              <input
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-sm font-mono"
              />
            </div>
            <button
              onClick={handleRegisterClient}
              disabled={isRegistering}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl active:bg-blue-700 transition-colors"
            >
              {isRegistering ? '등록 중...' : '고객 등록하기'}
            </button>
          </div>

          {/* 등록된 고객 목록 */}
          {registeredClients.length > 0 && (
            <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <p className="text-xs font-bold text-gray-500 px-4 py-3 border-b border-gray-100">
                등록된 고객 ({registeredClients.length}명)
              </p>
              {registeredClients.map(c => (
                <div key={c.id} className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">{c.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{c.id.slice(0, 8)}...</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 창고 운영 설정 */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 mb-2 ml-1">창고 운영 설정</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">총 운영 구역 (Zone)</span>
              <div className="flex items-center">
                <input type="number" defaultValue={20} className="w-16 text-right border border-gray-200 rounded-md p-1 mr-2 text-sm outline-none focus:border-blue-500" />
                <span className="text-sm text-gray-500">개</span>
              </div>
            </div>
            <div className="p-4 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">기본 월 보관료</span>
              <div className="flex items-center">
                <input type="number" defaultValue={120000} className="w-24 text-right border border-gray-200 rounded-md p-1 mr-2 text-sm outline-none focus:border-blue-500" />
                <span className="text-sm text-gray-500">원</span>
              </div>
            </div>
          </div>
        </section>

        {/* 시스템 정보 */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 mb-2 ml-1">시스템 정보</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">앱 버전</span>
              <span className="text-sm font-medium text-gray-900">v1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">데이터베이스</span>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">연결됨 ✅</span>
            </div>
          </div>
        </section>

      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-[100] flex justify-around items-center h-14">
        <button onClick={() => router.push('/admin')} className="flex flex-col items-center justify-center w-full h-full text-gray-400">
          <span className="text-xl mb-0.5">📊</span>
          <span className="text-[10px] font-medium">대시보드</span>
        </button>
        <button onClick={() => router.push('/admin/booking')} className="flex flex-col items-center justify-center w-full h-full text-gray-400">
          <span className="text-xl mb-0.5">📦</span>
          <span className="text-[10px] font-medium">예약관리</span>
        </button>
        <button onClick={() => router.push('/admin/billing')} className="flex flex-col items-center justify-center w-full h-full text-gray-400">
          <span className="text-xl mb-0.5">💲</span>
          <span className="text-[10px] font-medium">정산</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full text-blue-600">
          <span className="text-xl mb-0.5">⚙️</span>
          <span className="text-[10px] font-bold">설정</span>
        </button>
      </div>
    </div>
  );
}