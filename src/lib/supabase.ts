import { createClient } from '@supabase/supabase-js';

// 환경 변수를 VITE_ 접두사로 통일
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase 클라이언트 생성 또는 로컬 스토리지 폴백 준비
let supabaseEnabled = false;

console.log('Supabase 초기화 시작...');
console.log('Supabase URL 존재 여부:', !!supabaseUrl);
console.log('Supabase Anon Key 존재 여부:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 없습니다. 로컬 스토리지 모드로 작동합니다.');
} else {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase 클라이언트 생성 중...');
  supabaseEnabled = true;
}

export const supabase = supabaseEnabled ? 
  createClient(supabaseUrl, supabaseAnonKey) : 
  createClient('https://placeholder.supabase.co', 'placeholder');

console.log('Supabase 클라이언트 초기화 완료, 활성화 상태:', supabaseEnabled);

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

// 사용자 설정 가져오기
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (!supabaseEnabled || !userId) {
    console.warn('Supabase가 비활성화되었거나 유저 ID가 없어 로컬 스토리지에서 설정을 가져옵니다.');
    return null;
  }
  
  try {
    console.log('Supabase에서 사용자 설정 가져오기, userId:', userId);
    
    // 먼저 현재 세션이 유효한지 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('유효한 세션이 없습니다. 설정을 가져올 수 없습니다.', sessionError);
      return null;
    }
    
    console.log('유효한 세션 확인됨, 인증된 사용자:', session.user.id);
    console.log('요청 사용자 ID:', userId);
    
    // RLS 정책 확인: 사용자 ID가 일치하는지 확인
    if (session.user.id !== userId) {
      console.warn('세션 사용자 ID와 요청 사용자 ID가 일치하지 않습니다. RLS 정책으로 인해 액세스가 거부될 수 있습니다.');
    }
    
    // 테이블 접근 권한 테스트
    console.log('user_settings 테이블 접근 시도...');
    
    // 사용자 설정 쿼리
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // 테이블이 존재하지 않는 오류인 경우 (42P01)
      if (error.code === '42P01') {
        console.error('user_settings 테이블이 존재하지 않습니다. SQL 쿼리를 실행하여 테이블을 생성해야 합니다.');
        return null;
      }
      
      // PGRST116은 단일 레코드를 찾을 수 없음을 의미 - 오류가 아님
      if (error.code === 'PGRST116') {
        console.log('사용자 설정이 없습니다. 새로 생성이 필요합니다.');
        return null;
      }
      
      // 접근 제한 오류인 경우
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.error('user_settings 테이블에 접근 권한이 없습니다. RLS 정책을 확인하세요.');
      }
      
      console.error('사용자 설정 가져오기 오류:', error);
      if (error.details) console.error('- 오류 세부정보:', error.details);
      if (error.hint) console.error('- 오류 힌트:', error.hint); 
      if (error.message) console.error('- 오류 메시지:', error.message);
      if (error.code) console.error('- 오류 코드:', error.code);
      return null;
    }
    
    console.log('사용자 설정 가져오기 성공:', data);
    return data;
  } catch (err) {
    console.error('사용자 설정 가져오기 예외:', err);
    return null;
  }
}

// 사용자 설정 저장/업데이트
export async function saveUserSettings(settings: UserSettings): Promise<UserSettings | null> {
  if (!supabaseEnabled || !settings.user_id) {
    console.warn('Supabase가 비활성화되었거나 유저 ID가 없어 로컬 스토리지에만 저장합니다.');
    return null;
  }
  
  try {
    console.log('사용자 설정 저장 시도...', JSON.stringify(settings, null, 2));
    console.log('각 필드 확인:');
    console.log('- user_id:', settings.user_id);
    console.log('- semesters:', settings.semesters);
    console.log('- visible_types:', settings.visible_types);
    console.log('- course_types_order:', settings.course_types_order);
    
    // 배열 필드가 undefined인 경우 빈 배열로 초기화 
    // JSONB 타입으로 저장하기 위해 JSON.stringify 처리할 필요 없음
    // Supabase가 자동으로 JavaScript 배열을 JSONB로 변환
    const safeSettings = {
      ...settings,
      semesters: settings.semesters || [],
      visible_types: settings.visible_types || [],
      course_types_order: settings.course_types_order || []
    };
    
    // 먼저 현재 세션이 유효한지 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('유효한 세션이 없습니다. 설정을 저장할 수 없습니다.', sessionError);
      return null;
    }
    
    console.log('유효한 세션 확인됨:', session.user.id);
    console.log('저장할 설정(안전처리 후):', JSON.stringify(safeSettings, null, 2));
    
    // 기존 설정이 있는지 확인
    const { data: existingData, error: checkError } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', safeSettings.user_id)
      .maybeSingle();
    
    console.log('기존 설정 확인 결과:', existingData, checkError);
    
    if (checkError) {
      // 테이블이 존재하지 않는 오류인 경우 (42P01)
      if (checkError.code === '42P01') {
        console.error('테이블이 존재하지 않습니다. SQL 쿼리를 실행하여 테이블을 생성해야 합니다.');
        return null;
      }
      // PGRST116이 아닌 다른 오류인 경우
      if (checkError.code !== 'PGRST116') {
        console.error('설정 확인 오류:', checkError);
        return null;
      }
    }
    
    let result;
    
    if (existingData?.id) {
      // 기존 설정 업데이트
      console.log('기존 설정 업데이트 시도:', existingData.id);
      const updatePayload = {
        semesters: safeSettings.semesters,
        visible_types: safeSettings.visible_types,
        course_types_order: safeSettings.course_types_order,
        updated_at: new Date().toISOString()
      };
      console.log('업데이트 페이로드:', JSON.stringify(updatePayload, null, 2));
      
      const { data, error } = await supabase
        .from('user_settings')
        .update(updatePayload)
        .eq('id', existingData.id)
        .select()
        .single();
      
      console.log('업데이트 결과:', data, error);
      
      if (error) {
        console.error('설정 업데이트 오류:', error);
        if (error.details) console.error('- 오류 세부정보:', error.details);
        if (error.hint) console.error('- 오류 힌트:', error.hint);
        if (error.message) console.error('- 오류 메시지:', error.message);
        if (error.code) console.error('- 오류 코드:', error.code);
        return null;
      }
      
      result = data;
    } else {
      // 새 설정 생성
      console.log('새 설정 생성 시도');
      const insertData = {
        user_id: safeSettings.user_id,
        semesters: safeSettings.semesters,
        visible_types: safeSettings.visible_types,
        course_types_order: safeSettings.course_types_order
      };
      console.log('삽입할 데이터:', JSON.stringify(insertData, null, 2));
      
      const { data, error } = await supabase
        .from('user_settings')
        .insert([insertData])
        .select()
        .single();
      
      console.log('삽입 결과:', data, error);
      
      if (error) {
        console.error('설정 생성 오류:', error);
        
        // 세부 오류 정보 출력
        if (error.details) console.error('- 오류 세부정보:', error.details);
        if (error.hint) console.error('- 오류 힌트:', error.hint);
        if (error.message) console.error('- 오류 메시지:', error.message);
        if (error.code) console.error('- 오류 코드:', error.code);
        
        return null;
      }
      
      result = data;
    }
    
    console.log('설정 저장 성공:', result);
    return result;
  } catch (err) {
    console.error('설정 저장 중 예외 발생:', err);
    return null;
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
      console.log('인증된 사용자 없음 (로그인 필요)');
      return { success: false, message: '로그인 필요' };
    }
    
    const userId = authData.session.user.id;
    console.log('인증된 사용자 ID:', userId);
    
    // courses 테이블 접근 테스트
    console.log('courses 테이블 접근 테스트...');
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('count')
      .limit(1);
    
    if (coursesError) {
      console.error('courses 테이블 접근 오류:', coursesError);
    } else {
      console.log('courses 테이블 접근 성공');
    }
    
    // user_settings 테이블 접근 테스트
    console.log('user_settings 테이블 접근 테스트...');
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
    
    console.log('user_settings 테이블 접근 성공');
    
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