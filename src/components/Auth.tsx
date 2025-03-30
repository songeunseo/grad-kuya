import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import kuImage from '../assets/ku_img.png';

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
          emailRedirectTo: `${window.location.protocol}//${window.location.host}`
        }
      });
      
      console.log('회원가입 요청 결과:', error ? `오류: ${error.message}` : '성공');
      
      if (error) {
        throw error;
      }
      
      // 이메일 인증이 필요한 경우
      console.log('회원가입 성공, 이메일 인증 안내 화면으로 이동');
      setAuthStep(2); // 인증 안내 화면으로 바로 이동
      setMessage('회원가입이 완료되었습니다! 이메일로 전송된 인증 링크를 클릭하여 가입을 완료해주세요.');
      
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      setMessage(error.message || '회원가입 중 오류가 발생했습니다.');
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
    <div className="flex items-center justify-center min-h-screen h-screen bg-gray-100 overflow-hidden">
      <div className="w-full h-full">
        <div className="flex flex-col md:flex-row bg-white h-full w-full overflow-hidden">
          {/* 왼쪽: 소개 및 이미지 (6:4 비율) */}
          <div className="w-full md:w-[60%] bg-emerald-700 p-8 flex flex-col justify-center overflow-hidden transition-all duration-500 ease-in-out">
            <div className="text-white transform transition-all duration-500 max-w-3xl mx-auto">
              <div className="flex items-center mb-6">
                <h1 className="text-5xl font-bold drop-shadow-md">졸업할KU야</h1>
              </div>
              <p className="text-2xl mb-6 font-light">
                건국대학교 학생들을 위한 졸업 이수학점 관리 시스템
              </p>
              <p className="mb-8 text-lg font-light opacity-90">
                졸업에 필요한 이수 요건을 한눈에 확인하고 남은 학점을 효율적으로 관리하세요.<br/>
                학기별로 과목을 등록하고 졸업까지 남은 과정을 체계적으로 계획할 수 있습니다.
              </p>
              <div className="mt-6 transform transition-all duration-500 hover:scale-105">
                <img 
                  src={kuImage} 
                  alt="고려대학교" 
                  className="rounded-xl w-full max-h-[45vh] object-contain"
                />
              </div>
            </div>
          </div>
          
          {/* 오른쪽: 로그인 폼 (6:4 비율) */}
          <div className="w-full md:w-[40%] bg-white flex items-center justify-center h-full">
            <div className={`w-full max-w-md mx-auto px-8 ${!isSignUp ? 'my-auto' : ''}`}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {!isSignUp ? '로그인' : 
                   authStep === 0 ? '새 계정 만들기' : 
                   authStep === 2 ? '회원가입 완료' : 
                   '회원가입 완료'}
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  {!isSignUp ? '계정에 로그인하여 시작하세요' : 
                   authStep === 0 ? '새 계정을 만들어 시작하세요' : 
                   '인증을 완료하여 서비스를 이용하세요'}
                </p>
              </div>

              {message && (
                <div className="p-3 mb-8 text-sm text-blue-700 bg-blue-100 rounded-lg shadow-sm">
                  {message}
                </div>
              )}

              {isSignUp && authStep === 2 ?
                // 회원가입 완료 (이메일 인증 안내)
                <div className="text-center flex flex-col justify-center items-center">
                  <div className="mb-5">
                    <svg className="mx-auto h-16 w-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">이메일 인증이 필요합니다</h3>
                  <p className="mt-2 text-gray-600">
                    {email}로 인증 링크가 전송되었습니다.<br />
                    이메일의 링크를 클릭하여 인증을 완료해주세요.
                  </p>
                  <button
                    type="button"
                    onClick={toggleSignUp}
                    className="mt-8 px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-md transition-all"
                  >
                    로그인 화면으로 돌아가기
                  </button>
                </div>
              : (
                // 회원가입/로그인 정보 입력 단계
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        이메일
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={handleEmailChange}
                          onBlur={handleEmailBlur}
                          className={`appearance-none block w-full px-3 py-2 border ${
                            !emailValid ? 'border-red-500' : emailChecked ? 'border-emerald-500' : loading ? 'border-yellow-500' : 'border-gray-300'
                          } rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm`}
                          placeholder="example@email.com"
                        />
                        
                        {/* 이메일 유효성 표시 아이콘 */}
                        {email && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {!emailValid ? (
                              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            ) : emailChecked ? (
                              <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            ) : null}
                          </div>
                        )}
                      </div>
                      {!emailValid && (
                        <p className="mt-1 text-sm text-red-500">유효한 이메일 주소를 입력하세요.</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        비밀번호
                      </label>
                      <div>
                        <input
                          id="password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                          placeholder="비밀번호"
                        />
                      </div>
                      {isSignUp && (
                        <p className="mt-1 text-xs text-gray-500">
                          최소 6자 이상, 문자와 숫자 또는 특수문자를 포함해야 합니다.
                        </p>
                      )}
                    </div>

                    {isSignUp && (
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          비밀번호 확인
                        </label>
                        <div>
                          <input
                            id="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            placeholder="비밀번호 확인"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {isSignUp && authStep === 0 && (
                    <>
                      <div className="mt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">학업 정보</h3>
                        <p className="text-sm text-gray-500 mb-3">졸업 요건 계산을 위한 정보입니다.</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="admissionYear" className="block text-sm font-medium text-gray-700 mb-1">
                              입학년도
                            </label>
                            <select
                              id="admissionYear"
                              value={admissionYear}
                              onChange={(e) => setAdmissionYear(parseInt(e.target.value))}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            >
                              {yearOptions.map((year) => (
                                <option key={year} value={year}>{year}년</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label htmlFor="graduationSemester" className="block text-sm font-medium text-gray-700 mb-1">
                              졸업 예정 학기
                            </label>
                            <select
                              id="graduationSemester"
                              value={graduationSemester}
                              onChange={(e) => setGraduationSemester(e.target.value)}
                              required
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            >
                              <option value="">선택하세요</option>
                              {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                                <React.Fragment key={year}>
                                  <option value={`${year}년 1학기`}>{year}년 1학기</option>
                                  <option value={`${year}년 2학기`}>{year}년 2학기</option>
                                </React.Fragment>
                              ))}
                            </select>
                          </div>
                        
                          <div className="col-span-2">
                            <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">
                              전공
                            </label>
                            <input
                              id="major"
                              type="text"
                              value={major}
                              onChange={(e) => setMajor(e.target.value)}
                              required
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                              placeholder="예) 컴퓨터학과"
                            />
                          </div>
                        
                          <div className="col-span-2 grid grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="majorType" className="block text-sm font-medium text-gray-700 mb-1">
                                전공 유형
                              </label>
                              <select
                                id="majorType"
                                value={majorType}
                                onChange={(e) => setMajorType(e.target.value as MajorType)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                              >
                                <option value="단일전공">단일전공</option>
                                <option value="복수전공">복수전공</option>
                                <option value="부전공">부전공</option>
                              </select>
                            </div>
                            
                            {majorType !== '단일전공' && (
                              <div className="transition-all duration-300 ease-in-out">
                                <label htmlFor="secondMajor" className="block text-sm font-medium text-gray-700 mb-1">
                                  {majorType === '복수전공' ? '복수전공' : '부전공'}
                                </label>
                                <input
                                  id="secondMajor"
                                  type="text"
                                  value={secondMajor}
                                  onChange={(e) => setSecondMajor(e.target.value)}
                                  required
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                  placeholder="예) 경영학과"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          처리 중...
                        </span>
                      ) : (
                        isSignUp ? '회원가입' : '로그인'
                      )}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={toggleSignUp}
                      className="text-sm text-emerald-600 hover:text-emerald-500 transition-colors duration-300 underline hover:no-underline"
                    >
                      {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth; 