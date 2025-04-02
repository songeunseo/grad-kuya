import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import CourseTable from './components/CourseTable'
import GraduationCalculator from './components/GraduationCalculator'
import Auth from './pages/Auth'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import { migrateLocalStorageToDB, Course, checkTablesExist, directAddSampleCourse } from './lib/supabase'
import logo from './assets/logo_grad_kuya.svg'
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
      await checkTablesExist();
    };

    verifySupabase();
  }, []);

  const handleLogin = async (userId: string) => {
    setUserId(userId);
    localStorage.setItem('userId', userId);
    
    // 인증 상태 확인
    await supabase.auth.getSession();
    
    // Migrate localStorage data to Supabase if needed
    await migrateLocalStorageToDB(userId);
    
    // 테스트용 샘플 과목 추가 시도
    try {
      await directAddSampleCourse(userId);
    } catch (error) {
      console.error('샘플 과목 추가 실패:', error);
    }
  };

  const handleLogout = async () => {
    // Supabase 세션 종료
    await supabase.auth.signOut();
    
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

  // 메인 대시보드 컴포넌트
  const Dashboard = () => (
    <>
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
          <CourseTable userId={userId!} onCoursesUpdate={handleCoursesUpdate} />
          <GraduationCalculator courses={courses} userId={userId!} />
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={userId ? <Navigate to="/dashboard" /> : <Auth onLogin={handleLogin} />} />
        <Route path="/signup" element={userId ? <Navigate to="/dashboard" /> : <Auth onLogin={handleLogin} signup={true} />} />
        <Route path="/dashboard" element={userId ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App
