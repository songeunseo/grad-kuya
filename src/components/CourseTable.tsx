import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableCourse } from './DraggableCourse';
import AddCourseForm from './AddCourseForm';

interface Course {
  id: string;
  name: string;
  type: string;
  credits: number;
  semester: string;
  tag?: '선도적세계인' | '실천적사회인' | '창의적전문인';
}

const CourseTable: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: '1',
      name: '동아시아를관통하는문화콘텐츠',
      type: '심교',
      tag: '창의적전문인',
      credits: 2,
      semester: '2023년 상반기'
    },
    {
      id: '2',
      name: '창의적사고와표현',
      type: '기교',
      credits: 3,
      semester: '2024년 상반기'
    },
    {
      id: '3',
      name: '매스미디어론',
      type: '심교',
      tag: '선도적세계인',
      credits: 3,
      semester: '2024년 상반기'
    },
    {
      id: '6',
      name: '미적분학',
      type: '지교',
      credits: 3,
      semester: '2023년 상반기'
    },
    {
      id: '7',
      name: 'C프로그래밍',
      type: '지교',
      credits: 3,
      semester: '2024년 상반기'
    },
    {
      id: '8',
      name: '확률과통계',
      type: '지교',
      credits: 3,
      semester: '2024년 상반기'
    },
    {
      id: '9',
      name: '이산수학',
      type: '지교',
      credits: 3,
      semester: '2024년 하반기'
    },
    {
      id: '10',
      name: 'JAVA프로그래밍',
      type: '지교',
      credits: 3,
      semester: '2024년 하반기'
    },
    {
      id: '11',
      name: '웹프로그래밍',
      type: '전선',
      credits: 3,
      semester: '2024년 상반기'
    },
    {
      id: '12',
      name: '시스템프로그래밍',
      type: '전선',
      credits: 3,
      semester: '2024년 하반기'
    },
    {
      id: '13',
      name: '기계학습',
      type: '전선',
      credits: 3,
      semester: '2024년 하반기'
    },
    {
      id: '14',
      name: '랜덤프로세스개론',
      type: '전선',
      credits: 3,
      semester: '2024년 하반기'
    },
    {
      id: '15',
      name: '전공기초프로젝트',
      type: '전선',
      credits: 3,
      semester: '2025년 상반기'
    },
    {
      id: '16',
      name: '자료구조',
      type: '전선',
      credits: 3,
      semester: '2025년 상반기'
    },
    {
      id: '17',
      name: '운영체제',
      type: '전선',
      credits: 3,
      semester: '2025년 상반기'
    },
    {
      id: '18',
      name: '데이터베이스',
      type: '전선',
      credits: 3,
      semester: '2025년 상반기'
    },
    {
      id: '19',
      name: '인공지능',
      type: '전선',
      credits: 3,
      semester: '2025년 상반기'
    },
    {
      id: '20',
      name: '드림학기제',
      type: '전선',
      credits: 6,
      semester: '2025년 하반기'
    },
    {
      id: '21',
      name: '알고리즘',
      type: '전선',
      credits: 3,
      semester: '2025년 하반기'
    },
    {
      id: '22',
      name: '컴퓨터네트워크1',
      type: '전선',
      credits: 3,
      semester: '2025년 하반기'
    },
    {
      id: '23',
      name: '컴퓨터구조',
      type: '전선',
      credits: 3,
      semester: '2025년 하반기'
    },
    {
      id: '24',
      name: '데이터사이언스',
      type: '전선',
      credits: 3,
      semester: '2025년 하반기'
    },
    {
      id: '25',
      name: '보이지않는컴퓨팅세계',
      type: '일선',
      credits: 3,
      semester: '2023년 하반기'
    },
    {
      id: '26',
      name: '소비자와기업가정신개발',
      type: '일선',
      credits: 3,
      semester: '2023년 하반기'
    },
    {
      id: '27',
      name: '선형대수학',
      type: '지교',
      credits: 3,
      semester: '2025년 상반기'
    },
    {
      id: '28',
      name: '현대건축의이해',
      type: '일선',
      credits: 3,
      semester: '2026년 상반기'
    },
    {
      id: '29',
      name: '신화와철학',
      type: '일선',
      credits: 3,
      semester: '2026년 상반기'
    },
    {
      id: '30',
      name: '졸업프로젝트(1)',
      type: '전선',
      credits: 3,
      semester: '2027년 상반기'
    },
    {
      id: '31',
      name: '드림팀기획(하나더)',
      type: '전선',
      credits: 3,
      semester: '2027년 상반기'
    },
    {
      id: '32',
      name: '졸업프로젝트(2)',
      type: '전선',
      credits: 3,
      semester: '2027년 하반기'
    },
    {
      id: '33',
      name: '전공1',
      type: '전선',
      credits: 3,
      semester: '2027년 하반기'
    },
    {
      id: '34',
      name: '전공2',
      type: '전선',
      credits: 3,
      semester: '2027년 하반기'
    },
  ]);

  // LocalStorage에서 데이터 로드
  useEffect(() => {
    const savedCourses = localStorage.getItem('courses');
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses));
    }
  }, []);

  // 데이터 변경시 LocalStorage에 저장
  useEffect(() => {
    localStorage.setItem('courses', JSON.stringify(courses));
  }, [courses]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setCourses((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddCourse = (course: Omit<Course, 'id'>) => {
    const newCourse = {
      ...course,
      id: Date.now().toString(), // 고유한 ID 생성
    };
    setCourses([...courses, newCourse]);
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(courses.filter(course => course.id !== id));
  };

  const semesters = [
    '2023년 상반기', '2023년 하반기', '2024년 상반기', '2024년 하반기',
    '2025년 상반기', '2025년 하반기', '2026년 상반기', '2026년 하반기',
    '2027년 상반기', '2027년 하반기'
  ];

  const courseTypes = ['기교', '심교', '지교', '전선', '일선'];

  const getTypeStyle = (type: string) => {
    switch (type) {
      case '기교': return 'bg-amber-50/50 hover:bg-amber-50/70';
      case '심교': return 'bg-rose-50/50 hover:bg-rose-50/70';
      case '지교': return 'bg-sky-50/50 hover:bg-sky-50/70';
      case '전선': return 'bg-emerald-50/50 hover:bg-emerald-50/70';
      default: return 'bg-gray-50/50 hover:bg-gray-50/70';
    }
  };

  return (
    <div className="space-y-6">
      <AddCourseForm onAddCourse={handleAddCourse} />
      
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="w-full overflow-x-auto rounded-xl shadow-lg bg-white p-4">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white border-b-2 border-gray-200 p-3 text-sm font-semibold text-gray-600">
                  학기
                </th>
                {semesters.map((semester, index) => (
                  <th 
                    key={index} 
                    className="border-b-2 border-gray-200 p-3 text-sm font-semibold text-gray-600 min-w-[180px]"
                  >
                    {semester}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courseTypes.map((type, index) => (
                <tr key={index}>
                  <td className={`
                    sticky 
                    left-0 
                    z-10 
                    bg-white 
                    font-semibold 
                    text-gray-700 
                    p-3 
                    text-sm
                    border-b 
                    border-gray-100
                  `}>
                    {type}
                  </td>
                  {semesters.map((semester) => (
                    <td 
                      key={semester} 
                      className={`
                        ${getTypeStyle(type)}
                        p-3 
                        border-b 
                        border-gray-100
                        transition-colors 
                        duration-200
                        min-h-[120px]
                        align-top
                      `}
                    >
                      <SortableContext 
                        items={courses.filter(course => 
                          course.semester === semester && course.type === type
                        )} 
                        strategy={verticalListSortingStrategy}
                      >
                        {courses
                          .filter(course => course.semester === semester && course.type === type)
                          .map(course => (
                            <div key={course.id} className="relative group">
                              <DraggableCourse
                                id={course.id}
                                name={course.name}
                                type={course.type}
                                credits={course.credits}
                                tag={course.tag}
                              />
                              <button
                                onClick={() => handleDeleteCourse(course.id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-100 hover:bg-red-200 text-red-500 rounded-full p-1 transition-opacity duration-200"
                                title="삭제"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ))}
                      </SortableContext>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DndContext>
    </div>
  );
};

export default CourseTable; 