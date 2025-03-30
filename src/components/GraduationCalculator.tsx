import React, { useMemo, useState, useEffect } from 'react';
import { Course } from '../lib/supabase';
import { getUserSettings, saveUserSettings } from '../lib/supabase';

interface CreditRequirement {
  type: string;
  required: number;
  completed: number;
  remaining: number;
}

interface GraduationCalculatorProps {
  courses: Course[];
  userId: string;
}

const GraduationCalculator: React.FC<GraduationCalculatorProps> = ({ courses, userId }) => {
  const defaultCreditTypes = [
    { name: '기교', required: 12 },
    { name: '심교', required: 15 },
    { name: '지교', required: 18 },
    { name: '지필', required: 2 },
    { name: '전필', required: 46 },
    { name: '전선', required: 26 },
    { name: '전기', required: 0 },
    { name: '일선', required: 13 },
    { name: '교직', required: 0 },
    { name: '반교', required: 0 },
  ];

  // 저장된 기준학점이 있으면 불러오기, 없으면 기본값 사용
  const [creditTypes, setCreditTypes] = useState(defaultCreditTypes);
  const [isEditing, setIsEditing] = useState(false);
  const [editableCredits, setEditableCredits] = useState(defaultCreditTypes);
  const [totalRequired, setTotalRequired] = useState(132);
  
  // Supabase에서 사용자 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      if (!userId) return;
      
      try {
        const settings = await getUserSettings(userId);
        
        if (settings && settings.credit_requirements && settings.credit_requirements.length > 0) {
          setCreditTypes(settings.credit_requirements);
          setEditableCredits(settings.credit_requirements);
        } else {
          // 설정이 없으면 로컬 스토리지에서 시도
          loadFromLocalStorage();
        }
        
        if (settings && settings.total_credit_required) {
          setTotalRequired(settings.total_credit_required);
        }
      } catch (error) {
        console.error('기준학점 설정 불러오기 실패:', error);
        // 오류 시 로컬 스토리지에서 로드
        loadFromLocalStorage();
      }
    };
    
    // 로컬 스토리지에서 설정 로드하는 함수
    const loadFromLocalStorage = () => {
      try {
        const savedCreditTypes = localStorage.getItem('creditRequirements');
        const savedTotalRequired = localStorage.getItem('totalCreditRequired');
        
        if (savedCreditTypes) {
          setCreditTypes(JSON.parse(savedCreditTypes));
          setEditableCredits(JSON.parse(savedCreditTypes));
        }
        
        if (savedTotalRequired) {
          setTotalRequired(JSON.parse(savedTotalRequired));
        }
      } catch (e) {
        console.error('로컬 스토리지에서 설정 로드 실패:', e);
      }
    };
    
    loadSettings();
  }, [userId]);

  // 학기 목록: 연도-학기 형식으로 변환 (예: 2025년 상반기 -> 2025-1학기)
  const formattedSemesters = useMemo(() => {
    // 과목에서 유니크한 학기 목록 추출
    const uniqueSemesters = [...new Set(courses.map(course => course.semester))];
    
    // 학기를 연도 기준으로 정렬
    return uniqueSemesters
      .sort((a, b) => {
        const yearA = parseInt(a.split('년')[0]);
        const yearB = parseInt(b.split('년')[0]);
        if (yearA !== yearB) return yearA - yearB;
        
        // 같은 연도면 상반기/하반기로 정렬
        return a.includes('상반기') ? -1 : 1;
      })
      .map(semester => {
        const year = semester.split('년')[0];
        const half = semester.includes('상반기') ? '1' : '2';
        return `${year}-${half}학기`;
      });
  }, [courses]);

  // 유형별, 학기별 학점 계산
  const creditsByTypeAndSemester = useMemo(() => {
    const result: { [key: string]: { [key: string]: number } } = {};
    
    // 초기화
    creditTypes.forEach(type => {
      result[type.name] = {};
      formattedSemesters.forEach(semester => {
        result[type.name][semester] = 0;
      });
    });
    
    // 학점 합산
    courses.forEach(course => {
      const year = course.semester.split('년')[0];
      const half = course.semester.includes('상반기') ? '1' : '2';
      const formattedSemester = `${year}-${half}학기`;
      
      if (result[course.type] && result[course.type][formattedSemester] !== undefined) {
        result[course.type][formattedSemester] += course.credits;
      }
    });
    
    return result;
  }, [courses, formattedSemesters, creditTypes]);

  // 유형별 총 이수 학점 계산
  const totalCreditsByType = useMemo(() => {
    const result: { [key: string]: number } = {};
    
    creditTypes.forEach(type => {
      result[type.name] = formattedSemesters.reduce((sum, semester) => {
        return sum + (creditsByTypeAndSemester[type.name][semester] || 0);
      }, 0);
    });
    
    return result;
  }, [creditsByTypeAndSemester, formattedSemesters, creditTypes]);

  // 남은 학점 계산
  const remainingCreditsByType = useMemo(() => {
    const result: { [key: string]: number } = {};
    
    creditTypes.forEach(type => {
      const completed = totalCreditsByType[type.name] || 0;
      result[type.name] = Math.max(0, type.required - completed);
    });
    
    return result;
  }, [totalCreditsByType, creditTypes]);

  // 학기별 총 학점 계산
  const totalCreditsBySemester = useMemo(() => {
    const result: { [key: string]: number } = {};
    
    formattedSemesters.forEach(semester => {
      result[semester] = creditTypes.reduce((sum, type) => {
        return sum + (creditsByTypeAndSemester[type.name][semester] || 0);
      }, 0);
    });
    
    return result;
  }, [creditsByTypeAndSemester, formattedSemesters, creditTypes]);

  // 총 이수 학점
  const totalCreditsCompleted = useMemo(() => {
    return creditTypes.reduce((sum, type) => {
      return sum + (totalCreditsByType[type.name] || 0);
    }, 0);
  }, [totalCreditsByType, creditTypes]);

  // 총 남은 학점
  const totalCreditsRemaining = useMemo(() => {
    return Math.max(0, totalRequired - totalCreditsCompleted);
  }, [totalCreditsCompleted, totalRequired]);

  // 기준학점 편집 시작
  const handleStartEditing = () => {
    setEditableCredits([...creditTypes]);
    setIsEditing(true);
  };

  // 기준학점 편집 취소
  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  // 기준학점 저장
  const handleSaveEditing = async () => {
    setCreditTypes(editableCredits);
    setIsEditing(false);
    
    // 로컬 스토리지에 백업 저장
    localStorage.setItem('creditRequirements', JSON.stringify(editableCredits));
    localStorage.setItem('totalCreditRequired', JSON.stringify(totalRequired));
    
    // Supabase에 설정 저장
    if (userId) {
      try {
        const settings = {
          user_id: userId,
          credit_requirements: editableCredits,
          total_credit_required: totalRequired
        };
        
        const result = await saveUserSettings(settings);
        
        if (!result) {
          console.warn('기준학점 설정 저장 실패');
        }
      } catch (error) {
        console.error('기준학점 설정 저장 중 오류 발생:', error);
      }
    }
  };

  // 특정 이수구분의 기준학점 변경
  const handleCreditChange = (index: number, value: number) => {
    const updatedCredits = [...editableCredits];
    updatedCredits[index] = {
      ...updatedCredits[index],
      required: value
    };
    setEditableCredits(updatedCredits);
  };

  // 총 기준학점 변경
  const handleTotalRequiredChange = (value: number) => {
    setTotalRequired(value);
  };

  return (
    <div className="mt-8 bg-white p-4 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-center">졸업 계산기</h2>
        {isEditing ? (
          <div className="flex space-x-2">
            <button 
              onClick={handleCancelEditing}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button 
              onClick={handleSaveEditing}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              저장
            </button>
          </div>
        ) : (
          <button 
            onClick={handleStartEditing}
            className="px-3 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            기준학점 수정
          </button>
        )}
      </div>
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-gray-50">
            <th className="border-b-2 border-gray-200 p-3 text-sm font-semibold text-gray-600">이수구분</th>
            <th className="border-b-2 border-gray-200 p-3 text-sm font-semibold text-gray-600">기준학점</th>
            {formattedSemesters.map((semester, index) => (
              <th key={index} className="border-b-2 border-gray-200 p-3 text-sm font-semibold text-gray-600">{semester}</th>
            ))}
            <th className="border-b-2 border-gray-200 p-3 text-sm font-semibold text-gray-600">잔여학점</th>
          </tr>
        </thead>
        <tbody>
          {(isEditing ? editableCredits : creditTypes).map((type, index) => (
            <tr key={index} className={`
              ${type.name === '기교' ? 'bg-amber-50/50' :
                type.name === '심교' ? 'bg-rose-50/50' :
                type.name === '지교' ? 'bg-sky-50/50' :
                type.name === '지필' ? 'bg-sky-100/50' :
                type.name === '전필' ? 'bg-emerald-100/50' :
                type.name === '전선' ? 'bg-emerald-50/50' :
                type.name === '전기' ? 'bg-emerald-50/70' :
                type.name === '일선' ? 'bg-gray-50/50' :
                type.name === '교직' ? 'bg-violet-50/50' :
                type.name === '반교' ? 'bg-orange-50/50' :
                'bg-white'
              }
            `}>
              <td className="border-b border-gray-100 p-3 font-medium text-gray-700">{type.name}</td>
              <td className="border-b border-gray-100 p-3 text-center">
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={type.required}
                    onChange={(e) => handleCreditChange(index, parseInt(e.target.value) || 0)}
                    className="w-16 p-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  type.required
                )}
              </td>
              {formattedSemesters.map((semester, i) => (
                <td key={i} className="border-b border-gray-100 p-3 text-center">
                  {creditsByTypeAndSemester[type.name][semester] || 0}
                </td>
              ))}
              <td className="border-b border-gray-100 p-3 text-center">
                {remainingCreditsByType[type.name]}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-100 font-bold">
            <td className="border-b border-gray-100 p-3">총점</td>
            <td className="border-b border-gray-100 p-3 text-center">
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={totalRequired}
                  onChange={(e) => handleTotalRequiredChange(parseInt(e.target.value) || 0)}
                  className="w-16 p-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                totalRequired
              )}
            </td>
            {formattedSemesters.map((semester, i) => (
              <td key={i} className="border-b border-gray-100 p-3 text-center">
                {totalCreditsBySemester[semester] || 0}
              </td>
            ))}
            <td className="border-b border-gray-100 p-3 text-center">{totalCreditsRemaining}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default GraduationCalculator; 