import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onLogin: (userId: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      console.log('인증 상태 확인 중...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('인증 상태 확인 오류:', error);
        return;
      }
      
      if (user) {
        console.log('이미 로그인된 사용자 발견:', user.id);
        onLogin(user.id);
      } else {
        console.log('로그인된 사용자 없음');
      }
    };
    checkUser();
  }, [onLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        // Sign up
        console.log('회원가입 시도:', email);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        console.log('회원가입 결과:', data);
        setMessage('회원가입이 완료되었습니다. 이메일을 확인해주세요.');
      } else {
        // Sign in
        console.log('로그인 시도:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        console.log('로그인 결과:', data);
        if (data.user) {
          console.log('로그인 성공! 사용자 ID:', data.user.id);
          onLogin(data.user.id);
        } else {
          console.error('로그인 실패: user 객체 없음');
          setMessage('로그인 처리 중 오류가 발생했습니다.');
        }
      }
    } catch (error: any) {
      console.error('인증 처리 중 오류:', error);
      setMessage(error.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            졸업할KU야
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp ? '새 계정 만들기' : '로그인하여 시작하기'}
          </p>
        </div>

        {message && (
          <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                이메일
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="이메일"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              {loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-emerald-600 hover:text-emerald-500"
            >
              {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth; 