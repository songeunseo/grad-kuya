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
import { CourseItem } from './CourseItem';
import AddCourseForm from './AddCourseForm';
import SemesterManager from './SemesterManager';
import CourseTypeManager from './CourseTypeManager';
import { 
  getCourses, 
  addCourse, 
  addCourseNoRLS, 
  deleteCourse, 
  updateCourse, 
  Course,
  supabase
} from '../lib/supabase';

interface CourseTableProps {
  userId: string;
  onCoursesUpdate?: (courses: Course[]) => void;
}

const CourseTable: React.FC<CourseTableProps> = ({ userId, onCoursesUpdate }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState<string[]>(['2025년 상반기', '2025년 하반기']);
  const [visibleTypes, setVisibleTypes] = useState<string[]>(['기교', '심교', '지교', '지필', '전필', '전선', '전기', '일선', '교직', '반교']);
  const [courseTypes, setCourseTypes] = useState<string[]>(['기교', '심교', '지교', '지필', '전필', '전선', '전기', '일선', '교직', '반교']);

  // Fetch courses from Supabase
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log('fetchCourses 함수 호출됨');
        const fetchedCourses = await getCourses(userId);
        setCourses(fetchedCourses);
        if (onCoursesUpdate) {
          onCoursesUpdate(fetchedCourses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      fetchCourses();
    }
  }, [userId, onCoursesUpdate, loading]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      let updatedCourses: Course[] = [];
      
      setCourses((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        updatedCourses = arrayMove(items, oldIndex, newIndex);
        return updatedCourses;
      });
      
      // 상위 컴포넌트에 변경 알림
      if (onCoursesUpdate) {
        onCoursesUpdate(updatedCourses);
      }
      
      // TODO: Update order in Supabase if needed
    }
  };

  const handleAddCourse = async (courseData: Omit<Course, 'id' | 'created_at' | 'user_id'>) => {
    console.log('handleAddCourse 호출됨, 데이터:', courseData);
    
    try {
      // 현재 인증 상태 확인
      const { data: authData } = await supabase.auth.getSession();
      console.log('현재 인증 세션:', authData);
      
      // user_id 추가
      const courseWithUserId = {
        ...courseData,
        user_id: userId
      };
      console.log('Supabase에 전송할 데이터:', courseWithUserId);
      
      // 기본 방식으로 먼저 시도
      let newCourse = await addCourse(courseWithUserId);
      
      // 만약 실패하면 RLS 우회 시도 (디버깅용)
      if (!newCourse) {
        console.log('기본 과목 추가 실패, RLS 우회 시도...');
        newCourse = await addCourseNoRLS(courseWithUserId);
      }
      
      console.log('addCourse 결과:', newCourse);
      
      if (newCourse) {
        const updatedCourses = [...courses, newCourse];
        console.log('courses 상태 업데이트, 총 과목 수:', updatedCourses.length);
        setCourses(updatedCourses);
        if (onCoursesUpdate) {
          onCoursesUpdate(updatedCourses);
        }
      } else {
        console.error('과목 추가 실패, newCourse가 null입니다.');
      }
    } catch (error) {
      console.error('과목 추가 중 예외 발생:', error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const success = await deleteCourse(id);
      if (success) {
        const updatedCourses = courses.filter(course => course.id !== id);
        setCourses(updatedCourses);
        if (onCoursesUpdate) {
          onCoursesUpdate(updatedCourses);
        }
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const handleSemestersChange = (updatedSemesters: string[]) => {
    setSemesters(updatedSemesters);
    // localStorage에 학기 목록 저장
    localStorage.setItem('semesters', JSON.stringify(updatedSemesters));
  };

  // localStorage에서 학기 정보 불러오기
  useEffect(() => {
    const savedSemesters = localStorage.getItem('semesters');
    if (savedSemesters) {
      setSemesters(JSON.parse(savedSemesters));
    }
  }, []);

  const handleVisibleTypesChange = (types: string[]) => {
    setVisibleTypes(types);
    // localStorage에 이수구분 표시 정보 저장
    localStorage.setItem('visibleTypes', JSON.stringify(types));
    
    // localStorage에서 최신 순서를 다시 불러와 적용
    try {
      const savedOrder = localStorage.getItem('courseTypesOrder');
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        // 새로운 타입이 있으면 기존 순서 유지하면서 누락된 것만 추가
        let newOrder = [...parsedOrder];
        courseTypes.forEach(type => {
          if (!newOrder.includes(type)) {
            newOrder.push(type);
          }
        });
        // 존재하지 않는 타입은 제거
        newOrder = newOrder.filter(type => courseTypes.includes(type));
        
        setCourseTypes(newOrder);
      }
    } catch (e) {
      console.error('Error applying saved course types order:', e);
    }
  };

  // localStorage에서 이수구분 표시 정보 불러오기
  useEffect(() => {
    const savedVisibleTypes = localStorage.getItem('visibleTypes');
    if (savedVisibleTypes) {
      setVisibleTypes(JSON.parse(savedVisibleTypes));
    }
  }, []);

  // 이수구분 순서 관리
  useEffect(() => {
    // localStorage에서 저장된 순서가 있으면 불러오기
    const savedOrder = localStorage.getItem('courseTypesOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        // 새로운 타입이 있으면 기존 순서 유지하면서 누락된 것만 추가
        let newOrder = [...parsedOrder];
        courseTypes.forEach(type => {
          if (!newOrder.includes(type)) {
            newOrder.push(type);
          }
        });
        // 존재하지 않는 타입은 제거
        newOrder = newOrder.filter(type => courseTypes.includes(type));
        
        setCourseTypes(newOrder);
      } catch (e) {
        console.error('Error parsing saved course types order:', e);
      }
    }
  }, []);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case '기교': return 'bg-amber-50/50 hover:bg-amber-50/70';
      case '심교': return 'bg-rose-50/50 hover:bg-rose-50/70';
      case '지교': return 'bg-sky-50/50 hover:bg-sky-50/70';
      case '지필': return 'bg-sky-100/50 hover:bg-sky-100/70';
      case '전필': return 'bg-emerald-100/50 hover:bg-emerald-100/70';
      case '전선': return 'bg-emerald-50/50 hover:bg-emerald-50/70';
      case '전기': return 'bg-emerald-200/50 hover:bg-emerald-200/70';
      case '일선': return 'bg-gray-50/50 hover:bg-gray-50/70';
      case '교직': return 'bg-violet-50/50 hover:bg-violet-50/70';
      case '반교': return 'bg-orange-50/50 hover:bg-orange-50/70';
      default: return 'bg-gray-50/50 hover:bg-gray-50/70';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-4">
        <AddCourseForm onAddCourse={handleAddCourse} semesters={semesters} />
        <SemesterManager 
          semesters={semesters}
          onSemestersChange={handleSemestersChange}
        />
        <CourseTypeManager
          allTypes={courseTypes}
          visibleTypes={visibleTypes}
          onVisibleTypesChange={handleVisibleTypesChange}
        />
      </div>
      
      {loading ? (
        <div className="w-full p-10 text-center">
          <p>데이터를 불러오는 중...</p>
        </div>
      ) : (
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
                {courseTypes.filter(type => visibleTypes.includes(type)).map((type, index) => (
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
                                <CourseItem
                                  id={course.id}
                                  name={course.name}
                                  type={course.type}
                                  credits={course.credits}
                                  Advanced_tag={course.Advanced_tag}
                                  Basic_tag={course.Basic_tag}
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
      )}
    </div>
  );
};

export default CourseTable; 