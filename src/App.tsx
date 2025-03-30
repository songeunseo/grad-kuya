import React, { useState, useEffect } from 'react'
import CourseTable from './components/CourseTable'
import GraduationCalculator from './components/GraduationCalculator'
import Auth from './components/Auth'
import { migrateLocalStorageToDB, Course, checkTablesExist, directAddSampleCourse } from './lib/supabase'
import logo from './assets/logo.svg'
import { supabase } from './lib/supabase'

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    // Check if we have userId in localStorage (quick check before auth process)
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
    setLoading(false);

    // 테이블 존재 여부 확인
    const verifySupabase = async () => {
      const exists = await checkTablesExist();
      console.log('Supabase 테이블 확인 결과:', exists);
    };

    verifySupabase();
  }, []);

  const handleLogin = async (userId: string) => {
    console.log('로그인 처리, 사용자 ID:', userId);
    setUserId(userId);
    localStorage.setItem('userId', userId);
    
    // 인증 상태 확인
    const { data: { session } } = await supabase.auth.getSession();
    console.log('로그인 후 세션 정보:', session);
    
    // Migrate localStorage data to Supabase if needed
    await migrateLocalStorageToDB(userId);
    
    // 테스트용 샘플 과목 추가 시도
    try {
      const result = await directAddSampleCourse(userId);
      console.log('샘플 과목 추가 결과:', result);
    } catch (error) {
      console.error('샘플 과목 추가 실패:', error);
    }
  };

  const handleLogout = async () => {
    // Supabase 세션 종료
    await supabase.auth.signOut();
    console.log('Supabase 로그아웃 완료');
    
    // 로컬 상태 초기화
    setUserId(null);
    localStorage.removeItem('userId');
  };

  const handleCoursesUpdate = (updatedCourses: Course[]) => {
    setCourses(updatedCourses);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;
  }

  if (!userId) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          <img src={logo} alt="logo" className="w-32" />
        </h1>
        <button 
          onClick={() => handleLogout()}
          className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          로그아웃
        </button>
      </header>
      <div className="space-y-8">
        <CourseTable userId={userId} onCoursesUpdate={handleCoursesUpdate} />
        <GraduationCalculator courses={courses} />
      </div>
    </div>
  )
}

export default App
