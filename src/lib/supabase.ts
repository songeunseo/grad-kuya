import { createClient } from '@supabase/supabase-js';

// 환경 변수를 VITE_ 접두사로 통일
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase 클라이언트 생성 또는 로컬 스토리지 폴백 준비
let supabaseEnabled = false;
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 없습니다. 로컬 스토리지 모드로 작동합니다.');
} else {
  console.log('Supabase URL:', supabaseUrl.substring(0, 10) + '...');
  supabaseEnabled = true;
}

export const supabase = supabaseEnabled ? 
  createClient(supabaseUrl, supabaseAnonKey) : 
  createClient('https://placeholder.supabase.co', 'placeholder');

// 모델 정의
export interface Course {
  id: string;
  name: string;
  type: string;
  credits: number;
  semester: string;
  Advanced_tag?: '선도적세계인' | '실천적사회인' | '창의적전문인';
  Basic_tag?: '글쓰기' | '외국어' | 'S/W' | '인성';
  user_id?: string;
  created_at?: string;
}

// 로컬 스토리지에서 데이터 가져오기
function getCoursesFromLocalStorage(): Course[] {
  try {
    const stored = localStorage.getItem('courses');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('로컬 스토리지 데이터 파싱 오류:', e);
    return [];
  }
}

// 로컬 스토리지에 데이터 저장
function saveCoursesToLocalStorage(courses: Course[]) {
  localStorage.setItem('courses', JSON.stringify(courses));
}

// 과목 가져오기 - Supabase 또는 로컬 스토리지
export async function getCourses(userId: string): Promise<Course[]> {
  if (supabaseEnabled) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Supabase 과목 가져오기 오류:', error);
        return getCoursesFromLocalStorage(); // 폴백
      }
      
      return data || [];
    } catch (err) {
      console.error('Supabase 연결 오류, 로컬 스토리지 사용:', err);
      return getCoursesFromLocalStorage();
    }
  } else {
    return getCoursesFromLocalStorage();
  }
}

// 과목 추가 - Supabase 또는 로컬 스토리지
export async function addCourse(course: Omit<Course, 'id' | 'created_at'>) {
  console.log('과목 추가 시도:', course);
  
  if (supabaseEnabled) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([course])
        .select();
      
      if (error) {
        console.error('Supabase 과목 추가 오류:', error);
        // 오류 발생 시 로컬 스토리지로 폴백
        return addCourseToLocalStorage(course);
      }
      
      console.log('Supabase 과목 추가 성공:', data);
      return data ? data[0] : null;
    } catch (err) {
      console.error('Supabase 예외 발생:', err);
      return addCourseToLocalStorage(course);
    }
  } else {
    return addCourseToLocalStorage(course);
  }
}

// 로컬 스토리지에 과목 추가
function addCourseToLocalStorage(course: Omit<Course, 'id' | 'created_at'>): Course {
  const courses = getCoursesFromLocalStorage();
  const newCourse: Course = {
    ...course,
    id: Date.now().toString(), // 임시 ID 생성
    created_at: new Date().toISOString()
  };
  
  courses.push(newCourse);
  saveCoursesToLocalStorage(courses);
  console.log('로컬 스토리지에 과목 추가됨:', newCourse);
  
  return newCourse;
}

// 과목 업데이트 - Supabase 또는 로컬 스토리지
export async function updateCourse(course: Course) {
  if (supabaseEnabled) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update(course)
        .eq('id', course.id)
        .select();
      
      if (error) {
        console.error('Supabase 과목 업데이트 오류:', error);
        return updateCourseInLocalStorage(course);
      }
      
      return data ? data[0] : null;
    } catch (err) {
      console.error('Supabase 연결 오류:', err);
      return updateCourseInLocalStorage(course);
    }
  } else {
    return updateCourseInLocalStorage(course);
  }
}

// 로컬 스토리지에서 과목 업데이트
function updateCourseInLocalStorage(course: Course): Course {
  const courses = getCoursesFromLocalStorage();
  const index = courses.findIndex(c => c.id === course.id);
  
  if (index !== -1) {
    courses[index] = course;
    saveCoursesToLocalStorage(courses);
    console.log('로컬 스토리지 과목 업데이트됨:', course);
    return course;
  }
  
  console.error('로컬 스토리지에서 업데이트할 과목을 찾을 수 없음:', course.id);
  return course;
}

// 과목 삭제 - Supabase 또는 로컬 스토리지
export async function deleteCourse(id: string) {
  if (supabaseEnabled) {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase 과목 삭제 오류:', error);
        return deleteCourseFromLocalStorage(id);
      }
      
      return true;
    } catch (err) {
      console.error('Supabase 연결 오류:', err);
      return deleteCourseFromLocalStorage(id);
    }
  } else {
    return deleteCourseFromLocalStorage(id);
  }
}

// 로컬 스토리지에서 과목 삭제
function deleteCourseFromLocalStorage(id: string): boolean {
  const courses = getCoursesFromLocalStorage();
  const filteredCourses = courses.filter(c => c.id !== id);
  
  if (filteredCourses.length !== courses.length) {
    saveCoursesToLocalStorage(filteredCourses);
    console.log('로컬 스토리지에서 과목 삭제됨:', id);
    return true;
  }
  
  console.error('로컬 스토리지에서 삭제할 과목을 찾을 수 없음:', id);
  return false;
}

// 로컬 스토리지 데이터를 Supabase로 마이그레이션
export async function migrateLocalStorageToDB(userId: string) {
  if (!supabaseEnabled) {
    console.warn('Supabase가 비활성화되어 마이그레이션을 수행할 수 없습니다.');
    return;
  }
  
  const courses = getCoursesFromLocalStorage();
  if (courses.length === 0) return;
  
  try {
    const coursesWithUserId = courses.map(course => ({
      ...course,
      user_id: userId
    }));
    
    const { error } = await supabase
      .from('courses')
      .insert(coursesWithUserId);
    
    if (error) {
      console.error('데이터 마이그레이션 오류:', error);
    } else {
      console.log('데이터 마이그레이션 성공');
      localStorage.removeItem('courses'); // 마이그레이션 성공 후 로컬 스토리지 삭제
    }
  } catch (error) {
    console.error('마이그레이션 중 예외 발생:', error);
  }
} 