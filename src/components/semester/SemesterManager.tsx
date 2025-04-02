import React, { useState } from 'react';
import '../../styles/modal.css'; // 모달 스타일 임포트
import SemesterModal from './SemesterModal';
import useSemesterManagement from '../../hooks/useSemesterManagement';

interface SemesterManagerProps {
  semesters: string[];
  onSemestersChange: (semesters: string[]) => void;
}

/**
 * 학기 관리 메인 컴포넌트
 */
const SemesterManager: React.FC<SemesterManagerProps> = ({ semesters, onSemestersChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // 학기 관리 훅 사용
  const { 
    addSemester, 
    addMultipleSemesters, 
    deleteSemester, 
    semesterToGradeFormat, 
    generateYearOptions 
  } = useSemesterManagement(semesters);

  // 모달 토글 함수
  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  // 단일 학기 추가 핸들러
  const handleAddSemester = (year: number, semesterType: string) => {
    const updatedSemesters = addSemester(year, semesterType);
    onSemestersChange(updatedSemesters);
  };

  // 다중 학기 추가 핸들러
  const handleAddMultipleSemesters = (startYear: number, endYear: number) => {
    const updatedSemesters = addMultipleSemesters(startYear, endYear);
    onSemestersChange(updatedSemesters);
  };

  // 학기 삭제 핸들러
  const handleDeleteSemester = (semester: string) => {
    const updatedSemesters = deleteSemester(semester);
    onSemestersChange(updatedSemesters);
  };

  // 년도 옵션 생성
  const yearOptions = generateYearOptions();

  return (
    <div>
      <button 
        onClick={toggleModal}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
        학기 관리
      </button>

      <SemesterModal 
        isOpen={isOpen}
        onClose={toggleModal}
        semesters={semesters}
        yearOptions={yearOptions}
        onAddSingle={handleAddSemester}
        onAddMultiple={handleAddMultipleSemesters}
        onDelete={handleDeleteSemester}
        semesterToGradeFormat={semesterToGradeFormat}
      />
    </div>
  );
};

export default SemesterManager; 