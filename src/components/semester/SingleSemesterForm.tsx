import React, { useState } from 'react';

interface SingleSemesterFormProps {
  years: number[];
  onAdd: (year: number, semesterType: string) => void;
}

/**
 * 단일 학기 추가 폼 컴포넌트
 */
const SingleSemesterForm: React.FC<SingleSemesterFormProps> = ({ years, onAdd }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [semesterType, setSemesterType] = useState<'상반기' | '하반기' | '하계 계절학기' | '동계 계절학기'>('상반기');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(year, semesterType);
  };

  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium mb-2">단일 학기 추가</h4>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 mb-3">
          <select 
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="p-2 border rounded flex-1"
          >
            {years.map(year => (
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
          type="submit"
          className="w-full py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
        >
          학기 추가
        </button>
      </form>
    </div>
  );
};

export default SingleSemesterForm; 