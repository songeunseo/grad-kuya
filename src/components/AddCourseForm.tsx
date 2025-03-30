import React, { useState } from 'react';

interface CourseFormProps {
  onAddCourse: (course: {
    name: string;
    type: string;
    credits: number;
    semester: string;
  }) => void;
}

const AddCourseForm: React.FC<CourseFormProps> = ({ onAddCourse }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('기교');
  const [credits, setCredits] = useState(3);
  const [semester, setSemester] = useState('2024년 상반기');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddCourse({
        name,
        type,
        credits,
        semester,
      });
      setName('');
      setIsFormOpen(false);
    }
  };

  const semesters = [
    '2023년 상반기', '2023년 하반기', '2024년 상반기', '2024년 하반기',
    '2025년 상반기', '2025년 하반기', '2026년 상반기', '2026년 하반기',
    '2027년 상반기', '2027년 하반기'
  ];

  const courseTypes = ['기교', '심교', '지교(반교)', '전선', '일선'];

  if (!isFormOpen) {
    return (
      <button
        onClick={() => setIsFormOpen(true)}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        과목 추가
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">새 과목 추가</h3>
        <button
          onClick={() => setIsFormOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            과목명
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              이수구분
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {courseTypes.map((courseType) => (
                <option key={courseType} value={courseType}>
                  {courseType}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="credits" className="block text-sm font-medium text-gray-700 mb-1">
              학점
            </label>
            <input
              type="number"
              id="credits"
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="1"
              max="9"
            />
          </div>
          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
              학기
            </label>
            <select
              id="semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {semesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
          >
            취소
          </button>
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md"
          >
            추가
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCourseForm; 