import { createClient } from '@supabase/supabase-js';

// 환경 변수를 VITE_ 접두사로 통일
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase 클라이언트 생성 또는 로컬 스토리지 폴백 준비
let supabaseEnabled = false;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 없습니다. 로컬 스토리지 모드로 작동합니다.');
} else {
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
  Basic_tag?: '글쓰기' | '외국어' | 'S/W' | '인성' | '취창업';
  user_id?: string;
  created_at?: string;
}

// 사용자 설정 인터페이스 정의
export interface UserSettings {
  id?: string;
  user_id: string;
  semesters?: string[];
  visible_types?: string[];
  course_types_order?: string[];
  credit_requirements?: Array<{name: string, required: number}>;
  total_credit_required?: number;
  created_at?: string;
  updated_at?: string;
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
    const { data, error } = await supabase
      .from('courses')
      .select('*');
    
    if (error) {
      console.error('Supabase 과목 가져오기 오류:', error);
      console.warn('로컬 스토리지로 대체합니다.');
      return getCoursesFromLocalStorage();
    }
    
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
  if (!supabaseEnabled) {
    console.warn('Supabase가 비활성화되어 로컬 스토리지에만 저장합니다.');
    return addCourseToLocalStorage(course);
  }
  
  try {
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
    
    // Supabase에 저장 시도
    const { data, error, status } = await supabase
      .from('courses')
      .insert([supabaseCourse])
      .select();
    
    if (error) {
      console.error('Supabase 과목 추가 오류:', error);
      console.warn('로컬 스토리지에 대신 저장합니다.');
      return addCourseToLocalStorage(course);
    }
    
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
  
  return newCourse;
}

// 과목 업데이트 - Supabase에 저장
export async function updateCourse(course: Course) {
  if (!supabaseEnabled) {
    console.warn('Supabase가 비활성화되어 로컬 스토리지에서만 업데이트합니다.');
    return updateCourseInLocalStorage(course);
  }
  
  try {
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
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase 과목 삭제 오류:', error);
      console.warn('로컬 스토리지에서 대신 삭제합니다.');
      return deleteCourseFromLocalStorage(id);
    }
    
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
      localStorage.removeItem('courses'); // 마이그레이션 성공 후 로컬 스토리지 삭제
    }
  } catch (error) {
    console.error('마이그레이션 중 예외 발생:', error);
  }
}

// 과목 추가 - RLS 우회 버전
export async function addCourseNoRLS(course: Omit<Course, 'id' | 'created_at'>) {
  if (supabaseEnabled) {
    try {
      // 정책 우회 옵션 사용
      const { data, error, status } = await supabase
        .from('courses')
        .insert([course])
        .select();
      
      if (error) {
        console.error('Supabase RLS 우회 과목 추가 오류:', error);
        console.log('오류 코드:', error.code);
        console.log('오류 힌트:', error.hint);
        return null;
      }
      
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
      return { success: false, message: '로그인 필요' };
    }
    
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
    
    // Supabase에 직접 추가
    const { data, error } = await supabase
      .from('courses')
      .insert([sampleCourse])
      .select();
    
    if (error) {
      console.error('샘플 과목 추가 오류:', error);
      return null;
    }
    
    return data ? data[0] : null;
  } catch (err) {
    console.error('샘플 과목 추가 중 예외 발생:', err);
    return null;
  }
}

// 사용자 설정 가져오기
export async function getUserSettings(userId: string) {
  console.log('getUserSettings 호출됨, userId:', userId);
  
  if (!supabaseEnabled) {
    console.warn('Supabase가 비활성화되어 로컬 스토리지에서만 설정을 불러옵니다.');
    return null;
  }
  
  try {
    console.log('Supabase에서 사용자 설정 찾는 중...');
    
    // Accept 헤더 명시적 추가
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Supabase 설정 로드 오류:', error);
      console.warn('Supabase에 저장된 사용자 설정이 없어 로컬 스토리지에서 로드합니다.');
      return null;
    }
    
    if (!data) {
      console.log('사용자 설정이 없습니다. 기본값 사용');
      return null;
    }
    
    console.log('Supabase에서 찾은 사용자 설정:', data);
    return data;
  } catch (err) {
    console.error('Supabase 설정 로드 중 예외 발생:', err);
    return null;
  }
}

// 사용자 설정 저장하기
export async function saveUserSettings(settings: any) {
  console.log('saveUserSettings 호출됨, 데이터:', settings);
  
  if (!supabaseEnabled) {
    console.warn('Supabase가 비활성화되어 설정을 저장할 수 없습니다.');
    return false;
  }
  
  try {
    // 세션 확인
    const { data: session } = await supabase.auth.getSession();
    console.log('현재 세션:', session);
    
    if (!session?.session?.user) {
      console.error('설정 저장 에러: 인증된 사용자 없음');
      return false;
    }
    
    // 현재 설정이 있는지 확인
    console.log('기존 설정 확인 중...');
    const { data: existingSettings, error: checkError } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', settings.user_id)
      .maybeSingle();
    
    console.log('기존 설정 확인 결과:', existingSettings, checkError);
    
    let result;
    
    if (existingSettings) {
      // 기존 설정 업데이트
      console.log('기존 설정 업데이트 중...');
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          semesters: settings.semesters,
          visible_types: settings.visible_types,
          course_types_order: settings.course_types_order,
          credit_requirements: settings.credit_requirements,
          total_credit_required: settings.total_credit_required,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select();
      
      if (error) {
        console.error('설정 업데이트 에러:', error);
        return false;
      }
      
      console.log('설정 업데이트 결과:', data);
      result = true;
    } else {
      // 새 설정 생성
      console.log('새 설정 생성 중...');
      const { data, error } = await supabase
        .from('user_settings')
        .insert([{
          user_id: settings.user_id,
          semesters: settings.semesters,
          visible_types: settings.visible_types,
          course_types_order: settings.course_types_order,
          credit_requirements: settings.credit_requirements,
          total_credit_required: settings.total_credit_required
        }])
        .select();
      
      if (error) {
        console.error('설정 생성 에러:', error);
        return false;
      }
      
      console.log('설정 생성 결과:', data);
      result = true;
    }
    
    return result;
  } catch (err) {
    console.error('설정 저장 예외:', err);
    return false;
  }
}

// RLS 정책 테스트 - 테이블 권한 확인
export async function testTablePermissions() {
  if (!supabaseEnabled) {
    console.error('Supabase가 활성화되지 않아 테이블 권한을 확인할 수 없습니다.');
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
      return { success: false, message: '로그인 필요' };
    }
    
    const userId = authData.session.user.id;
    
    // courses 테이블 접근 테스트
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('count')
      .limit(1);
    
    if (coursesError) {
      console.error('courses 테이블 접근 오류:', coursesError);
    }
    
    // user_settings 테이블 접근 테스트
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('count')
      .limit(1);
    
    if (settingsError) {
      console.error('user_settings 테이블 접근 오류:', settingsError);
      
      // 테이블이 존재하지 않는 오류인 경우
      if (settingsError.code === '42P01') {
        return { 
          success: false, 
          message: 'user_settings 테이블이 존재하지 않습니다',
          userId 
        };
      }
      
      return { 
        success: false, 
        message: 'user_settings 테이블 접근 오류', 
        error: settingsError,
        userId 
      };
    }
    
    // user_settings 테이블에 기존 설정이 있는지 확인
    const { data: existingSettings, error: existingError } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('기존 설정 확인 오류:', existingError);
      return { 
        success: false, 
        message: '기존 설정 확인 오류', 
        error: existingError,
        userId 
      };
    }
    
    return { 
      success: true, 
      message: '모든 테이블 접근 성공', 
      hasExistingSettings: !!existingSettings?.id,
      userId
    };
  } catch (err) {
    console.error('테이블 권한 확인 중 예외 발생:', err);
    return { success: false, message: '예외 발생', error: err };
  }
} 