import React from 'react';
import SingleSemesterForm from './SingleSemesterForm';
import MultipleSemesterForm from './MultipleSemesterForm';
import SemesterList from './SemesterList';

interface SemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  semesters: string[];
  yearOptions: number[];
  onAddSingle: (year: number, semesterType: string) => void;
  onAddMultiple: (startYear: number, endYear: number) => void;
  onDelete: (semester: string) => void;
  semesterToGradeFormat: (semester: string) => string | null;
}

/**
 * 학기 관리 모달 컴포넌트
 */
const SemesterModal: React.FC<SemesterModalProps> = ({ 
  isOpen, 
  onClose, 
  semesters, 
  yearOptions, 
  onAddSingle, 
  onAddMultiple, 
  onDelete, 
  semesterToGradeFormat 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">학기 관리</h3>
          <button 
            onClick={onClose}
            className="modal-close-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* 단일 학기 추가 폼 */}
          <SingleSemesterForm 
            years={yearOptions} 
            onAdd={onAddSingle} 
          />
          
          {/* 연속 학기 추가 폼 */}
          <MultipleSemesterForm 
            years={yearOptions} 
            onAdd={onAddMultiple} 
          />

          {/* 학기 목록 */}
          <SemesterList 
            semesters={semesters} 
            semesterToGradeFormat={semesterToGradeFormat} 
            onDelete={onDelete} 
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SemesterModal; 