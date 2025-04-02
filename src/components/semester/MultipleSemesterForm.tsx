import React, { useState } from 'react';

interface MultipleSemesterFormProps {
  years: number[];
  onAdd: (startYear: number, endYear: number) => void;
}

/**
 * 여러 학기 추가 폼 컴포넌트
 */
const MultipleSemesterForm: React.FC<MultipleSemesterFormProps> = ({ years, onAdd }) => {
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endYear, setEndYear] = useState(new Date().getFullYear() + 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(startYear, endYear);
  };

  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium mb-2">연속 학기 추가 (상반기/하반기)</h4>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 items-center mb-3">
          <select 
            value={startYear}
            onChange={(e) => setStartYear(parseInt(e.target.value))}
            className="p-2 border rounded flex-1"
          >
            {years.map(year => (
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
            {years.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
          <span className="text-gray-500">까지</span>
        </div>
        <button 
          type="submit" 
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          연속 학기 추가
        </button>
      </form>
    </div>
  );
};

export default MultipleSemesterForm; 