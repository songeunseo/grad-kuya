import React, { useMemo } from 'react';
import { Course } from '../lib/supabase';

interface CreditRequirement {
  type: string;
  required: number;
  completed: number;
  remaining: number;
}

interface GraduationCalculatorProps {
  courses: Course[];
}

const GraduationCalculator: React.FC<GraduationCalculatorProps> = ({ courses }) => {
  const creditTypes = [
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
    const totalRequired = creditTypes.reduce((sum, type) => sum + type.required, 0);
    return Math.max(0, totalRequired - totalCreditsCompleted);
  }, [totalCreditsCompleted, creditTypes]);

  return (
    <div className="mt-8 bg-white p-4 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">졸업 계산기</h2>
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
          {creditTypes.map((type, index) => (
            <tr key={index} className={`
              ${type.name === '기교' ? 'bg-amber-50/50' :
                type.name === '심교' ? 'bg-rose-50/50' :
                type.name === '지교' ? 'bg-sky-50/50' :
                type.name === '전선' ? 'bg-emerald-50/50' :
                'bg-white'
              }
            `}>
              <td className="border-b border-gray-100 p-3 font-medium text-gray-700">{type.name}</td>
              <td className="border-b border-gray-100 p-3 text-center">{type.required}</td>
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
            <td className="border-b border-gray-100 p-3 text-center">132</td>
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