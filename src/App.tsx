import React, { useState, useEffect } from 'react'
import CourseTable from './components/CourseTable'
import GraduationCalculator from './components/GraduationCalculator'
import Auth from './components/Auth'
import { migrateLocalStorageToDB, Course } from './lib/supabase'
import logo from './assets/logo.svg'

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
  }, []);

  const handleLogin = async (userId: string) => {
    setUserId(userId);
    localStorage.setItem('userId', userId);
    
    // Migrate localStorage data to Supabase if needed
    await migrateLocalStorageToDB(userId);
  };

  const handleLogout = () => {
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
          onClick={handleLogout}
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
