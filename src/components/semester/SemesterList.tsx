import React from 'react';

interface SemesterListProps {
  semesters: string[];
  semesterToGradeFormat: (semester: string) => string | null;
  onDelete: (semester: string) => void;
}

/**
 * 학기 목록을 보여주는 컴포넌트
 */
const SemesterList: React.FC<SemesterListProps> = ({ 
  semesters, 
  semesterToGradeFormat, 
  onDelete 
}) => {
  return (
    <div>
      <h4 className="font-medium mb-2">현재 학기 목록</h4>
      <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
        {semesters.length === 0 ? (
          <p className="text-gray-500 text-center py-2">등록된 학기가 없습니다</p>
        ) : (
          <ul className="space-y-2">
            {semesters.map(semester => (
              <li key={semester} className="flex justify-between items-center border-b pb-2">
                <div>
                  <span>{semester}</span>
                  {!semester.includes('계절학기') && (
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {semesterToGradeFormat(semester)}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => onDelete(semester)}
                  className="text-red-500 hover:text-red-700"
                  title="삭제"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SemesterList; 