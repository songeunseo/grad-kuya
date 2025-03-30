import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onLogin: (userId: string) => void;
}

// 유효한 입학년도 범위 생성 (현재 년도부터 10년 전까지)
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= currentYear - 10; year--) {
    years.push(year);
  }
  return years;
};

// 전공 타입
type MajorType = '단일전공' | '복수전공' | '부전공';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [isEmailTaken, setIsEmailTaken] = useState(false);
  const [emailCheckComplete, setEmailCheckComplete] = useState(false);
  
  // 인증 단계 관리 (0: 회원가입 정보 입력, 2: 완료)
  const [authStep, setAuthStep] = useState(0);
  
  // 학업 정보
  const [admissionYear, setAdmissionYear] = useState<number>(new Date().getFullYear());
  const [major, setMajor] = useState('');
  const [majorType, setMajorType] = useState<MajorType>('단일전공');
  const [secondMajor, setSecondMajor] = useState('');
  const [graduationSemester, setGraduationSemester] = useState('');
  
  // 입학년도 옵션
  const yearOptions = generateYearOptions();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      console.log('인증 상태 확인 중...');
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          if (error.name === 'AuthSessionMissingError') {
            console.log('로그인된 사용자 없음 (세션 없음)');
            return;
          }
          console.error('인증 상태 확인 오류:', error);
          return;
        }
        
        if (user) {
          console.log('이미 로그인된 사용자 발견:', user.id);
          onLogin(user.id);
        } else {
          console.log('로그인된 사용자 없음');
        }
      } catch (error) {
        console.error('인증 확인 중 예외 발생:', error);
      }
    };
    checkUser();
  }, [onLogin]);

  const validateForm = () => {
    if (isSignUp) {
      // 이메일 유효성 검사 - @ 기호만 있으면 유효
      if (!email.includes('@')) {
        setMessage('이메일 주소에는 @ 기호가 포함되어야 합니다.');
        return false;
      }
      
      // 이메일 중복 확인은 항상 통과
      setEmailChecked(true);
      
      // 비밀번호 검사
      if (password !== confirmPassword) {
        setMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        return false;
      }
      
      if (password.length < 6) {
        setMessage('비밀번호는 최소 6자 이상이어야 합니다.');
        return false;
      }
      
      // 비밀번호 강도 검사
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      if (!(hasLetter && (hasNumber || hasSpecialChar))) {
        setMessage('비밀번호는 최소 하나의 문자와 숫자 또는 특수문자를 포함해야 합니다.');
        return false;
      }
      
      // 전공 정보는 유지
      if (!major) {
        setMessage('전공을 입력해주세요.');
        return false;
      }
      
      if (majorType !== '단일전공' && !secondMajor) {
        setMessage('복수전공 또는 부전공을 선택한 경우 해당 전공을 입력해주세요.');
        return false;
      }

      if (!graduationSemester) {
        setMessage('졸업 예정 학기를 선택해주세요.');
        return false;
      }
    } else {
      // 로그인 시에는 필드가 비어있는지만 확인
      if (!email) {
        setMessage('이메일을 입력해주세요.');
        return false;
      }
      
      if (!password) {
        setMessage('비밀번호를 입력해주세요.');
        return false;
      }
    }
    return true;
  };

  // 회원가입 제출 처리
  const handleSignUp = async () => {
    if (!validateForm()) {
      console.log('폼 검증 실패');
      return;
    }
    
    console.log('회원가입 시도:', email);
    setLoading(true);
    setMessage(''); // 기존 메시지 초기화
    
    try {
      // 이메일이 이미 존재하는지 먼저 확인
      console.log('이메일 중복 검사 시도');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy_password_for_check_' + Date.now()
      });
      
      // 로그인 오류 메시지 확인 - "Invalid login credentials"는 사용자가 존재한다는 의미
      if (signInError) {
        console.log('로그인 시도 오류:', signInError.message);
        
        if (signInError.message.includes('Invalid login credentials')) {
          // 이미 이메일이 등록되어 있음
          console.log('이미 등록된 이메일 감지');
          setEmailChecked(false);
          setIsEmailTaken(true);
          setMessage('이미 사용 중인 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.');
          setLoading(false);
          // alert로 명확하게 표시 (테스트용)
          alert('이미 사용 중인 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.');
          return;
        }
        
        // "User not found" 오류는 이메일이 존재하지 않는다는 의미 - 회원가입 진행 가능
        if (!signInError.message.toLowerCase().includes('user not found')) {
          console.log('예상치 못한 오류:', signInError.message);
        }
      } else {
        // 로그인이 성공했다면 이미 계정이 있는 것 (극히 드문 경우)
        console.log('이미 등록된 이메일 감지 (로그인 성공)');
        setEmailChecked(false);
        setIsEmailTaken(true);
        setMessage('이미 사용 중인 이메일입니다. 로그인해주세요.');
        setLoading(false);
        // alert로 명확하게 표시 (테스트용)
        alert('이미 사용 중인 이메일입니다. 로그인해주세요.');
        return;
      }
      
      // 계속해서 회원가입 처리
      console.log('Supabase 회원가입 요청 시작');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            admission_year: admissionYear,
            major,
            major_type: majorType,
            second_major: secondMajor,
            graduation_semester: graduationSemester
          },
          // 이메일 인증 요청
          emailRedirectTo: window.location.origin
        }
      });
      
      console.log('회원가입 요청 결과:', error ? `오류: ${error.message}` : '성공');
      
      if (error) {
        // 오류 메시지 확인해서 이메일 중복인 경우 처리
        const errorMsg = error.message.toLowerCase();
        console.log('오류 메시지:', errorMsg);
        
        if (errorMsg.includes('already registered') || 
            errorMsg.includes('already in use') || 
            errorMsg.includes('already exists') ||
            errorMsg.includes('user already registered')) {
          console.log('이미 사용 중인 이메일 확인됨');
          setEmailChecked(false);
          setIsEmailTaken(true);
          setMessage('이미 사용 중인 이메일입니다.');
          // alert로 명확하게 표시 (테스트용)
          alert('이미 사용 중인 이메일입니다.');
          setLoading(false);
          return;
        }
        throw error;
      }
      
      // 이메일 인증이 필요한 경우
      console.log('회원가입 성공, 이메일 인증 안내 화면으로 이동');
      setAuthStep(2); // 인증 안내 화면으로 바로 이동
      setMessage('회원가입이 완료되었습니다! 이메일로 전송된 인증 링크를 클릭하여 가입을 완료해주세요.');
      
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      setMessage(error.message || '회원가입 중 오류가 발생했습니다.');
      // alert로 명확하게 표시 (테스트용)
      alert(error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignUp) {
      // 일반 로그인 처리
      setLoading(true);
      setMessage('');
      
      console.log('로그인 시도:', email);
      
      try {
        console.log('Supabase에 로그인 요청 전송...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        console.log('로그인 요청 결과:', error ? `오류: ${error.message}` : '성공');
        
        if (error) {
          console.error('로그인 오류:', error);
          throw error;
        }
        
        console.log('로그인 성공, 사용자 데이터:', data.user);
        
        if (data.user) {
          console.log('로그인 성공! 사용자 ID:', data.user.id);
          onLogin(data.user.id);
        } else {
          console.error('사용자 데이터가 없음');
          setMessage('로그인 처리 중 오류가 발생했습니다.');
        }
      } catch (error: any) {
        console.error('로그인 오류:', error);
        if (error.message.includes('Invalid login credentials')) {
          setMessage('이메일 또는 비밀번호가 잘못되었습니다.');
        } else {
          setMessage(error.message || '로그인 중 오류가 발생했습니다.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      // 회원가입 처리
      handleSignUp();
    }
  };

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setMessage('');
    // 학업 정보 초기화
    if (!isSignUp) {
      setAdmissionYear(new Date().getFullYear());
      setMajor('');
      setMajorType('단일전공');
      setSecondMajor('');
      setGraduationSemester('');
    }
  };

  // 이메일 유효성 검사 함수
  const validateEmail = (email: string) => {
    // 이메일에 @ 기호가 있는지만 확인하는 매우 간단한 검사
    return email.includes('@');
  };
  
  // 이메일 중복 확인 함수
  const checkEmailAvailability = async (email: string) => {
    // 아무 이메일이나 유효하다고 처리
    setEmailValid(true);
    setEmailChecked(true);
    setIsEmailTaken(false);
    setEmailCheckComplete(true);
    console.log('이메일 확인 완료 (단순화됨):', email);
  };
  
  // 대체 이메일 확인 방법 삭제하고 단순화
  const checkEmailFallback = async (email: string) => {
    // 아무 이메일이나 유효하다고 처리
    setEmailChecked(true);
    setIsEmailTaken(false);
    setEmailCheckComplete(true);
    console.log('이메일 대체 확인 완료 (단순화됨):', email);
  };

  // 이메일 변경 시 상태 초기화
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    // @ 기호만 있으면 유효한 것으로 처리
    setEmailValid(newEmail.includes('@'));
    
    // 빠른 피드백을 위해 입력할 때마다 유효성 확인
    if (newEmail.includes('@')) {
      setEmailChecked(true);
      setIsEmailTaken(false);
      setEmailCheckComplete(true);
    } else {
      setEmailChecked(false);
      setEmailCheckComplete(false);
    }
    
    setMessage('');
  };

  // 이메일 필드 포커스 아웃 시 형식만 검사
  const handleEmailBlur = () => {
    // @ 기호만 있으면 유효한 것으로 처리
    if (email) {
      setEmailValid(email.includes('@'));
      if (email.includes('@')) {
        setEmailChecked(true);
        setIsEmailTaken(false);
        setEmailCheckComplete(true);
      }
    }
  };

  // 이메일 중복 확인 버튼 클릭 핸들러 (형식만 검사)
  const handleCheckEmail = () => {
    // @ 기호만 있으면 유효한 것으로 처리
    if (email) {
      setEmailValid(email.includes('@'));
      if (email.includes('@')) {
        setEmailChecked(true);
        setIsEmailTaken(false);
        setEmailCheckComplete(true);
      }
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
            {!isSignUp ? '로그인하여 시작하기' : 
             authStep === 0 ? '새 계정 만들기' : 
             authStep === 2 ? '회원가입 완료' : 
             '회원가입 완료'}
          </p>
        </div>

        {message && (
          <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg">
            {message}
          </div>
        )}

        {isSignUp && authStep === 2 ? (
          // 회원가입 완료 단계
          <div className="mt-8 space-y-6 text-center">
            <div className="text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="mt-4 text-xl font-bold">회원가입이 완료되었습니다</h2>
              <p className="mt-2 text-gray-600">이메일로 전송된 인증 링크를 클릭하여 가입을 완료해주세요.</p>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-bold">중요:</span> 이메일 인증 후에 로그인이 가능합니다. 
                  이메일을 확인해주세요.
                </p>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setAuthStep(0);
                    setMessage('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  로그인 화면으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        ) : (
          // 회원가입/로그인 정보 입력 단계
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <div className="relative mt-1">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      !emailValid ? 'border-red-500' : emailChecked ? 'border-emerald-500' : loading ? 'border-yellow-500' : 'border-gray-300'
                    } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm pr-24`}
                    placeholder="example@email.com"
                  />
                  {isSignUp && (
                    <div className="absolute inset-y-0 right-0 flex items-center mr-1">
                      {emailCheckComplete && !isEmailTaken && emailChecked ? (
                        <div className="px-3 text-emerald-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>확인됨</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCheckEmail}
                          disabled={loading || !email || !emailValid}
                          className={`px-3 h-full text-sm font-medium ${
                            loading ? 'text-yellow-500' : !email || !emailValid ? 'text-gray-400' : 'text-emerald-600 hover:text-emerald-700'
                          } focus:outline-none border-l border-gray-300`}
                        >
                          {loading ? "확인 중..." : "중복 확인"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {!emailValid && (
                  <p className="mt-1 text-xs text-red-500">
                    유효한 이메일 형식을 입력해주세요.
                  </p>
                )}
                {isSignUp && emailValid && email && !loading && emailCheckComplete && isEmailTaken && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    이미 사용 중인 이메일입니다.
                  </p>
                )}
                {isSignUp && emailValid && email && !loading && emailCheckComplete && !isEmailTaken && emailChecked && (
                  <p className="mt-1 text-xs text-emerald-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    사용 가능한 이메일입니다.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="비밀번호 (최소 6자)"
                />
                {isSignUp && (
                  <p className="mt-1 text-xs text-gray-500">
                    최소 6자 이상, 문자와 숫자 또는 특수문자를 포함해야 합니다.
                  </p>
                )}
              </div>

              {isSignUp && (
                <>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      비밀번호 확인
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      placeholder="비밀번호 확인"
                    />
                  </div>

                  <div className="py-3 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">학업 정보</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="admissionYear" className="block text-sm font-medium text-gray-700">
                          입학 연도
                        </label>
                        <select
                          id="admissionYear"
                          value={admissionYear}
                          onChange={(e) => setAdmissionYear(parseInt(e.target.value))}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                        >
                          {yearOptions.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="graduationSemester" className="block text-sm font-medium text-gray-700">
                          졸업 예정 학기
                        </label>
                        <select
                          id="graduationSemester"
                          value={graduationSemester}
                          onChange={(e) => setGraduationSemester(e.target.value)}
                          required
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                        >
                          <option value="">선택하세요</option>
                          {[2025, 2026, 2027, 2028, 2029, 2030, 2031].map(year => (
                            <React.Fragment key={year}>
                              <option value={`${year}년 1학기`}>{year}년 1학기</option>
                              <option value={`${year}년 2학기`}>{year}년 2학기</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="major" className="block text-sm font-medium text-gray-700">
                        학과/전공
                      </label>
                      <input
                        id="major"
                        type="text"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="예) 컴퓨터공학과"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">전공 유형</label>
                      <div className="mt-2 flex items-center space-x-4">
                        {(['단일전공', '복수전공', '부전공'] as MajorType[]).map((type) => (
                          <label key={type} className="inline-flex items-center">
                            <input
                              type="radio"
                              name="majorType"
                              value={type}
                              checked={majorType === type}
                              onChange={() => setMajorType(type as MajorType)}
                              className="form-radio h-4 w-4 text-emerald-600 transition duration-150 ease-in-out"
                            />
                            <span className="ml-2 text-sm">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {majorType !== '단일전공' && (
                      <div className="mt-4">
                        <label htmlFor="secondMajor" className="block text-sm font-medium text-gray-700">
                          {majorType === '복수전공' ? '복수전공' : '부전공'}
                        </label>
                        <input
                          id="secondMajor"
                          type="text"
                          value={secondMajor}
                          onChange={(e) => setSecondMajor(e.target.value)}
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                          placeholder="예) 경영학과"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
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
                onClick={toggleSignUp}
                className="text-sm text-emerald-600 hover:text-emerald-500"
              >
                {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth; 