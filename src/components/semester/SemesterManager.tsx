import React, { useState, useCallback } from 'react';
import '../../styles/modal.css';
import SemesterModal from './SemesterModal';
import useSemesterManagement, { SemesterType } from '../../hooks/useSemesterManagement';

interface SemesterManagerProps {
  semesters: string[];
  onSemestersChange: (semesters: string[]) => void;
}

const SemesterManager: React.FC<SemesterManagerProps> = ({ semesters, onSemestersChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    addSemester,
    addMultipleSemesters,
    deleteSemester,
    semesterToGradeFormat,
    yearOptions,
  } = useSemesterManagement(semesters);

  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);

  const handlers = {
    onAddSingle: (year: number, semesterType: string) =>
      onSemestersChange(addSemester(year, semesterType as SemesterType)),
    onAddMultiple: (startYear: number, endYear: number) =>
      onSemestersChange(addMultipleSemesters(startYear, endYear)),
    onDelete: (semester: string) =>
      onSemestersChange(deleteSemester(semester)),
  };

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
        onAddSingle={handlers.onAddSingle}
        onAddMultiple={handlers.onAddMultiple}
        onDelete={handlers.onDelete}
        semesterToGradeFormat={semesterToGradeFormat}
      />
    </div>
  );
};

export default SemesterManager;