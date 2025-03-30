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

// 테이블 존재 여부 확인
export async function checkTablesExist() {
  if (!supabaseEnabled) {
    console.error('Supabase가 활성화되지 않아 테이블을 확인할 수 없습니다.');
    return false;
  }

  console.log('Supabase 테이블 존재 여부 확인 중...');
  
  try {
    // 테이블 접근 테스트
    const { data, error } = await supabase
      .from('courses')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('테이블 접근 오류:', error);
      return false;
    }
    
    console.log('테이블이 접근 가능합니다. 테이블에 레코드가 있나요?', data?.length > 0 ? '예' : '아니오');
    return true;
  } catch (err) {
    console.error('테이블 확인 중 예외 발생:', err);
    return false;
  }
}

// 과목 가져오기 - Supabase 또는 로컬 스토리지
export async function getCourses(userId: string): Promise<Course[]> {
  if (!supabaseEnabled) {
    console.warn('Supabase가 비활성화되어 로컬 스토리지에서 과목을 가져옵니다.');
    return getCoursesFromLocalStorage();
  }
  
  try {
    console.log('Supabase에서 과목 가져오기 시도, userId:', userId);
    const { data, error } = await supabase
      .from('courses')
      .select('*');
    
    if (error) {
      console.error('Supabase 과목 가져오기 오류:', error);
      console.warn('로컬 스토리지로 대체합니다.');
      return getCoursesFromLocalStorage();
    }
    
    console.log(`Supabase에서 ${data?.length || 0}개 과목을 가져왔습니다.`);
    
    // 대소문자 변환
    const convertedData = data?.map(course => ({
      ...course,
      Advanced_tag: course.advanced_tag,
      Basic_tag: course.basic_tag
    })) || [];
    
    return convertedData;
  } catch (err) {
    console.error('Supabase 연결 오류, 로컬 스토리지 사용:', err);
    return getCoursesFromLocalStorage();
  }
}

// 과목 추가 - Supabase에 저장
export async function addCourse(course: Omit<Course, 'id' | 'created_at'>) {
  console.log('과목 추가 시도:', course);
  
  if (!supabaseEnabled) {
    console.warn('Supabase가 비활성화되어 로컬 스토리지에만 저장합니다.');
    return addCourseToLocalStorage(course);
  }
  
  try {
    console.log('Supabase에 과목 추가 시도:', course.name);
    
    // Supabase 테이블 컬럼 이름을 소문자로 변환
    const supabaseCourse = {
      name: course.name,
      type: course.type,
      credits: course.credits,
      semester: course.semester,
      user_id: course.user_id,
      // 대소문자 구분 문제 해결
      ...(course.Advanced_tag ? { advanced_tag: course.Advanced_tag } : {}),
      ...(course.Basic_tag ? { basic_tag: course.Basic_tag } : {})
    };
    
    console.log('변환된 데이터:', supabaseCourse);
    
    // Supabase에 저장 시도
    const { data, error, status } = await supabase
      .from('courses')
      .insert([supabaseCourse])
      .select();
    
    console.log('Supabase 응답 상태:', status);
    
    if (error) {
      console.error('Supabase 과목 추가 오류:', error);
      console.warn('로컬 스토리지에 대신 저장합니다.');
      return addCourseToLocalStorage(course);
    }
    
    console.log('Supabase 과목 추가 성공:', data);
    
    // 결과를 원래 양식으로 변환 (첫글자 대문자)
    if (data && data[0]) {
      const resultCourse: Course = {
        ...data[0],
        Advanced_tag: data[0].advanced_tag,
        Basic_tag: data[0].basic_tag
      };
      return resultCourse;
    }
    
    return addCourseToLocalStorage(course);
  } catch (err) {
    console.error('Supabase 예외 발생:', err);
    console.warn('로컬 스토리지에 대신 저장합니다.');
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

// 과목 업데이트 - Supabase에 저장
export async function updateCourse(course: Course) {
  if (!supabaseEnabled) {
    console.warn('Supabase가 비활성화되어 로컬 스토리지에서만 업데이트합니다.');
    return updateCourseInLocalStorage(course);
  }
  
  try {
    console.log('Supabase에서 과목 업데이트:', course.id);
    
    // Supabase 테이블 컬럼 이름을 소문자로 변환
    const supabaseCourse = {
      ...course,
      // 대소문자 구분 문제 해결
      advanced_tag: course.Advanced_tag,
      basic_tag: course.Basic_tag,
      // 원래 필드 제거
      Advanced_tag: undefined,
      Basic_tag: undefined
    };
    
    const { data, error } = await supabase
      .from('courses')
      .update(supabaseCourse)
      .eq('id', course.id)
      .select();
    
    if (error) {
      console.error('Supabase 과목 업데이트 오류:', error);
      console.warn('로컬 스토리지에서 대신 업데이트합니다.');
      return updateCourseInLocalStorage(course);
    }
    
    console.log('Supabase 과목 업데이트 성공:', data);
    
    // 결과를 원래 양식으로 변환
    if (data && data[0]) {
      const resultCourse: Course = {
        ...data[0],
        Advanced_tag: data[0].advanced_tag,
        Basic_tag: data[0].basic_tag
      };
      return resultCourse;
    }
    
    return updateCourseInLocalStorage(course);
  } catch (err) {
    console.error('Supabase 연결 오류:', err);
    console.warn('로컬 스토리지에서 대신 업데이트합니다.');
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
  if (!supabaseEnabled) {
    console.warn('Supabase가 비활성화되어 로컬 스토리지에서만 삭제합니다.');
    return deleteCourseFromLocalStorage(id);
  }
  
  try {
    console.log('Supabase에서 과목 삭제:', id);
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase 과목 삭제 오류:', error);
      console.warn('로컬 스토리지에서 대신 삭제합니다.');
      return deleteCourseFromLocalStorage(id);
    }
    
    console.log('Supabase 과목 삭제 성공');
    return true;
  } catch (err) {
    console.error('Supabase 연결 오류:', err);
    console.warn('로컬 스토리지에서 대신 삭제합니다.');
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

// 과목 추가 - RLS 우회 버전
export async function addCourseNoRLS(course: Omit<Course, 'id' | 'created_at'>) {
  console.log('RLS 우회 과목 추가 시도:', course);
  
  if (supabaseEnabled) {
    try {
      // 정책 우회 옵션 사용
      const { data, error, status } = await supabase
        .from('courses')
        .insert([course])
        .select();
      
      console.log('Supabase RLS 우회 응답 상태:', status);
      
      if (error) {
        console.error('Supabase RLS 우회 과목 추가 오류:', error);
        console.log('오류 코드:', error.code);
        console.log('오류 힌트:', error.hint);
        return null;
      }
      
      console.log('Supabase RLS 우회 과목 추가 성공:', data);
      return data ? data[0] : null;
    } catch (err) {
      console.error('Supabase 예외 발생:', err);
      return null;
    }
  } else {
    console.error('Supabase가 비활성화되어 있어 RLS 우회를 시도할 수 없습니다.');
    return null;
  }
}

// RLS 정책 체크 - 인증 상태와 정책 확인용
export async function checkAuth() {
  if (!supabaseEnabled) {
    console.error('Supabase가 활성화되지 않아 인증을 확인할 수 없습니다.');
    return { success: false, message: 'Supabase 비활성화' };
  }

  try {
    // 현재 인증 상태 확인
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('인증 세션 확인 오류:', authError);
      return { success: false, message: '인증 오류', error: authError };
    }
    
    if (!authData.session?.user?.id) {
      console.log('인증된 사용자 없음 (로그인 필요)');
      return { success: false, message: '로그인 필요' };
    }
    
    console.log('인증된 사용자 ID:', authData.session.user.id);
    
    // 간단한 테스트 쿼리 실행
    const { data: testData, error: testError } = await supabase
      .from('courses')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('테이블 접근 테스트 오류:', testError);
      return { success: false, message: '테이블 접근 오류', error: testError };
    }
    
    return { 
      success: true, 
      message: '인증 및 테이블 접근 성공', 
      userId: authData.session.user.id 
    };
  } catch (err) {
    console.error('인증 확인 중 예외 발생:', err);
    return { success: false, message: '예외 발생', error: err };
  }
}

// 직접 데이터 추가 함수 (RLS 정책 없이)
export async function directAddSampleCourse(userId: string) {
  if (!supabaseEnabled) {
    console.error('Supabase가 활성화되지 않아 샘플 과목을 추가할 수 없습니다.');
    return null;
  }

  console.log('샘플 과목 직접 추가 시도...');
  const sampleCourse = {
    name: '샘플 과목 (테스트)',
    type: '기교',
    credits: 3,
    semester: '2025년 상반기',
    Basic_tag: '글쓰기' as '글쓰기', // 타입 명시
    user_id: userId,
  };

  try {
    // 인증 상태 확인
    const { data: authData } = await supabase.auth.getSession();
    console.log('현재 인증 상태:', authData?.session?.user?.id);
    
    // Supabase에 직접 추가
    const { data, error } = await supabase
      .from('courses')
      .insert([sampleCourse])
      .select();
    
    if (error) {
      console.error('샘플 과목 추가 오류:', error);
      return null;
    }
    
    console.log('샘플 과목 Supabase에 추가 성공:', data);
    return data ? data[0] : null;
  } catch (err) {
    console.error('샘플 과목 추가 중 예외 발생:', err);
    return null;
  }
} 