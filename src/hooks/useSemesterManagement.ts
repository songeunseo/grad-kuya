import { useState } from 'react';

/**
 * 학기 관리를 위한 커스텀 훅
 */
export function useSemesterManagement(initialSemesters: string[]) {
  const [semesters, setSemesters] = useState<string[]>(initialSemesters);
  
  /**
   * 학기 정렬 함수
   */
  const sortSemesters = (a: string, b: string) => {
    // 년도 추출
    const yearA = parseInt(a.split('년')[0]);
    const yearB = parseInt(b.split('년')[0]);
    
    if (yearA !== yearB) return yearA - yearB;
    
    // 학기 순서 정의
    const semesterOrder = {
      '상반기': 0,
      '하계 계절학기': 1,
      '하반기': 2,
      '동계 계절학기': 3
    };
    
    const semTypeA = a.split('년 ')[1];
    const semTypeB = b.split('년 ')[1];
    
    return semesterOrder[semTypeA as keyof typeof semesterOrder] - 
           semesterOrder[semTypeB as keyof typeof semesterOrder];
  };

  /**
   * 단일 학기 추가 함수
   */
  const addSemester = (year: number, semesterType: string) => {
    const newSemester = `${year}년 ${semesterType}`;
    if (!semesters.includes(newSemester)) {
      const updatedSemesters = [...semesters, newSemester].sort(sortSemesters);
      setSemesters(updatedSemesters);
      return updatedSemesters;
    }
    return semesters;
  };

  /**
   * 다중 학기 추가 함수
   */
  const addMultipleSemesters = (startYear: number, endYear: number) => {
    if (startYear > endYear) return semesters;

    const newSemesters = [];
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

    if (newSemesters.length > 0) {
      const updatedSemesters = [...semesters, ...newSemesters].sort(sortSemesters);
      setSemesters(updatedSemesters);
      return updatedSemesters;
    }
    
    return semesters;
  };

  /**
   * 학기 삭제 함수
   */
  const deleteSemester = (semester: string) => {
    const updatedSemesters = semesters.filter(sem => sem !== semester);
    setSemesters(updatedSemesters);
    return updatedSemesters;
  };

  /**
   * 학기를 학년 학기 형식으로 변환
   */
  const semesterToGradeFormat = (semester: string) => {
    if (semester.includes('계절학기')) return null;
    
    // 순서대로 학년-학기 계산
    const index = semesters
      .filter(sem => !sem.includes('계절학기'))
      .findIndex(sem => sem === semester);
    
    if (index === -1) return null;
    
    // 0, 1 -> 1학년 1학기, 1학년 2학기
    // 2, 3 -> 2학년 1학기, 2학년 2학기
    const grade = Math.floor(index / 2) + 1;
    const semNumber = (index % 2) + 1;
    
    return `${grade}학년 ${semNumber}학기`;
  };

  /**
   * 년도 옵션 생성 함수
   */
  const generateYearOptions = () => {
    // 2016년부터 현재 년도 + 7년까지의 범위로 수정
    const startYear = 2016;
    const endYear = new Date().getFullYear() + 7;
    const years = [];
    for (let i = startYear; i <= endYear; i++) {
      years.push(i);
    }
    return years;
  };

  return {
    semesters,
    setSemesters,
    addSemester,
    addMultipleSemesters,
    deleteSemester,
    semesterToGradeFormat,
    generateYearOptions
  };
}

export default useSemesterManagement; 