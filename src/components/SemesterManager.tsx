import React, { useState } from 'react';
import '../styles/modal.css'; // 모달 스타일 임포트

interface SemesterManagerProps {
  semesters: string[];
  onSemestersChange: (semesters: string[]) => void;
}

const SemesterManager: React.FC<SemesterManagerProps> = ({ semesters, onSemestersChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [semesterType, setSemesterType] = useState<'상반기' | '하반기' | '하계 계절학기' | '동계 계절학기'>('상반기');
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endYear, setEndYear] = useState(new Date().getFullYear() + 1);

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  const handleAddSemester = () => {
    const newSemester = `${year}년 ${semesterType}`;
    if (!semesters.includes(newSemester)) {
      addSemesterAndSort(newSemester);
    }
  };

  const handleAddMultipleSemesters = () => {
    if (startYear > endYear) return;

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
      onSemestersChange(updatedSemesters);
    }
  };

  const addSemesterAndSort = (newSemester: string) => {
    const updatedSemesters = [...semesters, newSemester].sort(sortSemesters);
    onSemestersChange(updatedSemesters);
  };

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

  const handleDeleteSemester = (semester: string) => {
    const updatedSemesters = semesters.filter(sem => sem !== semester);
    onSemestersChange(updatedSemesters);
  };

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

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">학기 관리</h3>
              <button 
                onClick={toggleModal}
                className="modal-close-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* 단일 학기 추가 섹션 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">단일 학기 추가</h4>
                <div className="flex gap-2 mb-3">
                  <select 
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="p-2 border rounded flex-1"
                  >
                    {generateYearOptions().map(year => (
                      <option key={year} value={year}>{year}년</option>
                    ))}
                  </select>
                  <select 
                    value={semesterType}
                    onChange={(e) => setSemesterType(e.target.value as any)}
                    className="p-2 border rounded flex-1"
                  >
                    <option value="상반기">상반기</option>
                    <option value="하반기">하반기</option>
                    <option value="하계 계절학기">하계 계절학기</option>
                    <option value="동계 계절학기">동계 계절학기</option>
                  </select>
                </div>
                <button 
                  onClick={handleAddSemester}
                  className="w-full py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                >
                  학기 추가
                </button>
              </div>
              
              {/* 연속 학기 추가 섹션 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">연속 학기 추가 (상반기/하반기)</h4>
                <div className="flex gap-2 items-center mb-3">
                  <select 
                    value={startYear}
                    onChange={(e) => setStartYear(parseInt(e.target.value))}
                    className="p-2 border rounded flex-1"
                  >
                    {generateYearOptions().map(year => (
                      <option key={year} value={year}>{year}년</option>
                    ))}
                  </select>
                  <span className="text-gray-500">부터</span>
                </div>
                <div className="flex gap-2 items-center mb-3">
                  <select 
                    value={endYear}
                    onChange={(e) => setEndYear(parseInt(e.target.value))}
                    className="p-2 border rounded flex-1"
                  >
                    {generateYearOptions().map(year => (
                      <option key={year} value={year}>{year}년</option>
                    ))}
                  </select>
                  <span className="text-gray-500">까지</span>
                </div>
                <button 
                  onClick={handleAddMultipleSemesters}
                  className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  연속 학기 추가
                </button>
              </div>

              {/* 현재 학기 목록 */}
              <div>
                <h4 className="font-medium mb-2">현재 학기 목록</h4>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
                  {semesters.length === 0 ? (
                    <p className="text-gray-500 text-center py-2">등록된 학기가 없습니다</p>
                  ) : (
                    <ul className="space-y-2">
                      {semesters.map(semester => (
                        <li key={semester} className="flex justify-between items-center border-b pb-2">
                          <span>{semester}</span>
                          <button 
                            onClick={() => handleDeleteSemester(semester)}
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
            </div>

            <div className="mt-4 flex justify-end">
              <button 
                onClick={toggleModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterManager; 