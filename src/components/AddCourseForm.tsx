import React, { useState, useEffect } from 'react';
import { Course } from '../lib/supabase';

interface CourseFormProps {
  onAddCourse: (course: Omit<Course, 'id' | 'created_at' | 'user_id'>) => void;
  semesters?: string[];
}

const AddCourseForm: React.FC<CourseFormProps> = ({ onAddCourse, semesters = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('기교');
  const [credits, setCredits] = useState(3);
  const [semester, setSemester] = useState('');
  const [advancedTag, setAdvancedTag] = useState<'선도적세계인' | '실천적사회인' | '창의적전문인' | ''>('선도적세계인');
  const [basicTag, setBasicTag] = useState<'글쓰기' | '외국어' | 'S/W' | '인성' | ''>('글쓰기');

  // 기본 학기 목록 (semesters prop이 비어있을 경우 사용)
  const defaultSemesters = [
    '2025년 상반기', '2025년 하반기'
  ];

  // 실제 사용할 학기 목록
  const availableSemesters = semesters.length > 0 ? semesters : defaultSemesters;

  // 컴포넌트 마운트 시 기본 학기 설정
  useEffect(() => {
    if (availableSemesters.length > 0 && !semester) {
      setSemester(availableSemesters[0]);
    }
  }, [availableSemesters, semester]);

  // 타입이 변경될 때 자동으로 태그 초기화
  useEffect(() => {
    if (type === '기교') {
      setAdvancedTag('');
      setBasicTag('글쓰기');
    } else if (type === '심교') {
      setAdvancedTag('선도적세계인');
      setBasicTag('');
    } else if (type === '지교') {
      setAdvancedTag('');
      setBasicTag('글쓰기');
    } else {
      setAdvancedTag('');
      setBasicTag('');
    }
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      console.log('Adding course:', {
        name,
        type,
        credits,
        semester,
        ...(type === '심교' && advancedTag ? { Advanced_tag: advancedTag } : {}),
        ...(type === '기교' && basicTag ? { Basic_tag: basicTag } : {}),
        ...(type === '지교' && basicTag ? { Basic_tag: basicTag } : {})
      });
      
      onAddCourse({
        name,
        type,
        credits,
        semester,
        ...(type === '심교' && advancedTag ? { Advanced_tag: advancedTag } : {}),
        ...(type === '기교' && basicTag ? { Basic_tag: basicTag } : {}),
        ...(type === '지교' && basicTag ? { Basic_tag: basicTag } : {})
      });
      
      // 폼 초기화
      setName('');
      setType('기교');
      setCredits(3);
      // 모달 닫기
      setIsModalOpen(false);
    }
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    // 모달이 열릴 때 폼을 초기화
    if (!isModalOpen) {
      setName('');
      setType('기교');
      setCredits(3);
      if (availableSemesters.length > 0) {
        setSemester(availableSemesters[0]);
      }
    }
  };

  const courseTypes = ['기교', '심교', '지교', '전선', '일선'];

  const advancedTagOptions = [
    { value: '선도적세계인', label: '선도적세계인' },
    { value: '실천적사회인', label: '실천적사회인' },
    { value: '창의적전문인', label: '창의적전문인' },
  ];

  const basicTagOptions = [
    { value: '글쓰기', label: '글쓰기' },
    { value: '외국어', label: '외국어' },
    { value: 'S/W', label: 'S/W' },
    { value: '인성', label: '인성' },
  ];

  return (
    <div>
      <button
        onClick={toggleModal}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        과목 추가
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">새 과목 추가</h3>
              <button
                onClick={toggleModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                    {availableSemesters.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {type === '심교' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    인재상 태그
                  </label>
                  <div className="grid gap-2">
                    {advancedTagOptions.map((tagOption) => (
                      <label key={tagOption.value} className="inline-flex items-center">
                        <input
                          type="radio"
                          name="advancedTag"
                          value={tagOption.value}
                          checked={advancedTag === tagOption.value}
                          onChange={() => setAdvancedTag(tagOption.value as any)}
                          className="text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span className="ml-2 text-sm text-gray-700">{tagOption.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {(type === '지교' || type === '기교') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기초 태그
                  </label>
                  <div className="grid gap-2">
                    {basicTagOptions.map((tagOption) => (
                      <label key={tagOption.value} className="inline-flex items-center">
                        <input
                          type="radio"
                          name="basicTag"
                          value={tagOption.value}
                          checked={basicTag === tagOption.value}
                          onChange={() => setBasicTag(tagOption.value as any)}
                          className="text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span className="ml-2 text-sm text-gray-700">{tagOption.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={toggleModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCourseForm; 