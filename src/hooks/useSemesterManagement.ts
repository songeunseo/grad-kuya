import { useState, useCallback, useMemo } from 'react';

// 타입 정의 - 학기 타입을 리터럴로 제한하여 타입 안전성 강화
export type SemesterType = '상반기' | '하반기' | '하계 계절학기' | '동계 계절학기';

// 학기 순서 매핑을 상수로 분리 (코드 재사용 및 유지보수성 향상)
const SEMESTER_ORDER: Record<SemesterType, number> = {
  '상반기': 0,
  '하계 계절학기': 1,
  '하반기': 2,
  '동계 계절학기': 3
};

/**
 * 학기 관리를 위한 커스텀 훅
 * 학기 추가, 삭제, 정렬 등 관련 기능을 제공합니다.
 * 
 * @param initialSemesters 초기 학기 목록
 * @returns 학기 관리 관련 상태와 함수들
 */
export function useSemesterManagement(initialSemesters: string[]) {
  // 초기 값을 정렬하여 시작
  const sortedInitialSemesters = useMemo(() => 
    [...initialSemesters].sort(
      (a, b) => compareSemesters(a, b, SEMESTER_ORDER)
    ), 
    [initialSemesters]
  );
  
  const [semesters, setSemesters] = useState<string[]>(sortedInitialSemesters);
  
  /**
   * 두 학기를 비교하는 함수
   * (별도 함수로 분리하여 재사용성 향상)
   */
  const compareSemesters = useCallback(
    (a: string, b: string, orderMap: Record<SemesterType, number>) => {
      try {
        // 년도 추출
        const yearA = parseInt(a.split('년')[0]);
        const yearB = parseInt(b.split('년')[0]);
        
        if (yearA !== yearB) return yearA - yearB;
        
        // 학기 부분 추출
        const semTypeA = a.split('년 ')[1] as SemesterType;
        const semTypeB = b.split('년 ')[1] as SemesterType;
        
        // 알 수 없는 학기 타입이 있으면 0 반환 (정렬 유지)
        if (!(semTypeA in orderMap) || !(semTypeB in orderMap)) {
          console.warn('알 수 없는 학기 타입:', semTypeA, semTypeB);
          return 0;
        }
        
        return orderMap[semTypeA] - orderMap[semTypeB];
      } catch (error) {
        console.error('학기 비교 중 오류 발생:', error);
        return 0; // 오류 발생 시 정렬 순서 유지
      }
    },
    [] // 외부 의존성 없음
  );

  /**
   * 학기 정렬 함수
   */
  const sortSemesters = useCallback((items: string[]) => {
    return [...items].sort((a, b) => compareSemesters(a, b, SEMESTER_ORDER));
  }, [compareSemesters]);

  /**
   * 단일 학기 추가 함수
   * 
   * @param year 학년도
   * @param semesterType 학기 유형
   * @returns 업데이트된 학기 목록
   */
  const addSemester = useCallback((year: number, semesterType: SemesterType) => {
    // 입력값 유효성 검증
    if (!year || year < 2000 || year > 2100) {
      console.error('유효하지 않은 학년도:', year);
      return semesters;
    }
    
    if (!(semesterType in SEMESTER_ORDER)) {
      console.error('유효하지 않은 학기 유형:', semesterType);
      return semesters;
    }
    
    const newSemester = `${year}년 ${semesterType}`;
    
    // 이미 존재하는지 확인
    if (semesters.includes(newSemester)) {
      console.warn('이미 존재하는 학기:', newSemester);
      return semesters;
    }
    
    // 불변성을 유지하며 업데이트
    const updatedSemesters = sortSemesters([...semesters, newSemester]);
    setSemesters(updatedSemesters);
    return updatedSemesters;
  }, [semesters, sortSemesters]);

  /**
   * 다중 학기 추가 함수
   * 
   * @param startYear 시작 학년도
   * @param endYear 종료 학년도
   * @returns 업데이트된 학기 목록
   */
  const addMultipleSemesters = useCallback((startYear: number, endYear: number) => {
    // 입력값 유효성 검증
    if (startYear > endYear) {
      console.error('시작 연도가 종료 연도보다 큽니다:', startYear, endYear);
      return semesters;
    }
    
    if (startYear < 2000 || endYear > 2100) {
      console.error('유효하지 않은 연도 범위:', startYear, endYear);
      return semesters;
    }

    // 새 학기 목록 생성
    const newSemesters: string[] = [];
    for (let y = startYear; y <= endYear; y++) {
      const springSemester = `${y}년 상반기`;
      const fallSemester = `${y}년 하반기`;
      
      if (!semesters.includes(springSemester)) {
        newSemesters.push(springSemester);
      }
      
      if (!semesters.includes(fallSemester)) {
        newSemesters.push(fallSemester);
      }
    }

    if (newSemesters.length === 0) {
      return semesters; // 추가할 항목이 없으면 기존 목록 반환
    }
    
    // 불변성을 유지하며 업데이트
    const updatedSemesters = sortSemesters([...semesters, ...newSemesters]);
    setSemesters(updatedSemesters);
    return updatedSemesters;
  }, [semesters, sortSemesters]);

  /**
   * 계절학기 추가 함수
   * 
   * @param year 학년도
   * @param isSummer 하계 계절학기 여부 (true: 하계, false: 동계)
   * @returns 업데이트된 학기 목록
   */
  const addSeasonalSemester = useCallback((year: number, isSummer: boolean) => {
    const semesterType: SemesterType = isSummer ? '하계 계절학기' : '동계 계절학기';
    return addSemester(year, semesterType);
  }, [addSemester]);

  /**
   * 학기 삭제 함수
   * 
   * @param semester 삭제할 학기
   * @returns 업데이트된 학기 목록
   */
  const deleteSemester = useCallback((semester: string) => {
    if (!semesters.includes(semester)) {
      console.warn('존재하지 않는 학기 삭제 시도:', semester);
      return semesters;
    }
    
    const updatedSemesters = semesters.filter(sem => sem !== semester);
    setSemesters(updatedSemesters);
    return updatedSemesters;
  }, [semesters]);

  /**
   * 학기를 학년 학기 형식으로 변환
   * 
   * @param semester 변환할 학기
   * @returns '학년 학기' 형식의 문자열 (예: '1학년 1학기')
   */
  const semesterToGradeFormat = useCallback((semester: string) => {
    if (!semester || semester.includes('계절학기')) return null;
    
    // 정규 학기만 필터링하고 정렬
    const regularSemesters = useMemo(() => 
      semesters.filter(sem => !sem.includes('계절학기')).sort(
        (a, b) => compareSemesters(a, b, SEMESTER_ORDER)
      ),
      [semesters]
    );
    
    // 순서대로 학년-학기 계산
    const index = regularSemesters.findIndex(sem => sem === semester);
    
    if (index === -1) return null;
    
    // 0, 1 -> 1학년 1학기, 1학년 2학기
    // 2, 3 -> 2학년 1학기, 2학년 2학기
    const grade = Math.floor(index / 2) + 1;
    const semNumber = (index % 2) + 1;
    
    return `${grade}학년 ${semNumber}학기`;
  }, [semesters, compareSemesters]);

  /**
   * 년도 옵션 생성 함수
   * 메모이제이션으로 성능 최적화
   * 
   * @returns 선택 가능한 학년도 배열
   */
  const yearOptions = useMemo(() => {
    // 2016년부터 현재 년도 + 7년까지의 범위로 수정
    const startYear = 2016;
    const endYear = new Date().getFullYear() + 7;
    const years = [];
    for (let i = startYear; i <= endYear; i++) {
      years.push(i);
    }
    return years;
  }, []);
  
  /**
   * 전체 학기 설정 함수
   * 
   * @param newSemesters 새로 설정할 학기 목록
   */
  const setSemestersList = useCallback((newSemesters: string[]) => {
    const sortedSemesters = sortSemesters(newSemesters);
    setSemesters(sortedSemesters);
    return sortedSemesters;
  }, [sortSemesters]);

  /**
   * 학기별 학년도 목록 생성 (메모이제이션)
   */
  const semestersByYear = useMemo(() => {
    const result: Record<number, string[]> = {};
    
    semesters.forEach(semester => {
      const yearMatch = semester.match(/(\d{4})년/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        if (!result[year]) {
          result[year] = [];
        }
        result[year].push(semester);
      }
    });
    
    // 각 년도별 학기 목록 정렬
    Object.keys(result).forEach(year => {
      result[parseInt(year)].sort((a, b) => 
        compareSemesters(a, b, SEMESTER_ORDER)
      );
    });
    
    return result;
  }, [semesters, compareSemesters]);

  return {
    // 상태
    semesters,
    semestersByYear,
    yearOptions,
    
    // 액션
    setSemesters: setSemestersList,
    addSemester,
    addMultipleSemesters,
    addSeasonalSemester,
    deleteSemester,
    
    // 유틸리티
    semesterToGradeFormat,
    sortSemesters,
    compareSemesters
  };
}

export default useSemesterManagement; 