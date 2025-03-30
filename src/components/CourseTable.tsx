import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
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
  getUserSettings,
  saveUserSettings,
  supabase,
  testTablePermissions
} from '../lib/supabase';

// 드롭 영역 컴포넌트
const DroppableCell = ({ 
  children, 
  semester, 
  type, 
  style 
}: { 
  children: React.ReactNode, 
  semester: string, 
  type: string, 
  style: string 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${semester}-${type}`,
    data: {
      cellInfo: { semester, type }
    }
  });

  const getHighlightStyle = (type: string) => {
    switch (type) {
      case '기교': return 'bg-amber-100/70';
      case '심교': return 'bg-rose-100/70';
      case '지교': return 'bg-sky-100/70';
      case '지필': return 'bg-sky-200/70';
      case '전필': return 'bg-emerald-100/70';
      case '전선': return 'bg-emerald-50/80';
      case '전기': return 'bg-emerald-50/80';
      case '일선': return 'bg-gray-100/70';
      case '교직': return 'bg-violet-100/70';
      case '반교': return 'bg-orange-100/70';
      default: return 'bg-gray-100/70';
    }
  };

  const highlightStyle = getHighlightStyle(type);

  return (
    <td 
      ref={setNodeRef}
      className={`
        ${style}
        ${isOver ? highlightStyle : ''}
        p-3 
        border-b 
        border-gray-100
        transition-all 
        duration-200
        min-h-[120px]
        align-top
        ${isOver ? 'shadow-inner scale-[1.01]' : ''}
      `}
    >
      {children}
    </td>
  );
};

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
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // 사용자 설정 로드
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        console.log('사용자 설정 로드 시도...');
        
        // 테이블 권한 테스트 추가
        const permissionTest = await testTablePermissions();
        console.log('테이블 권한 테스트 결과:', permissionTest);
        
        // 인증 상태 확인을 먼저 수행
        const { data: authData } = await supabase.auth.getSession();
        if (!authData.session) {
          console.warn('활성 세션이 없습니다. 설정을 로드하지 않습니다.');
          setSettingsLoaded(true);
          return;
        }
        
        const settings = await getUserSettings(userId);
        
        if (settings) {
          console.log('Supabase에서 사용자 설정 로드 성공:', settings);
          
          // 학기 설정 적용
          if (settings.semesters && settings.semesters.length > 0) {
            setSemesters(settings.semesters);
          }
          
          // 이수구분 표시 설정 적용
          if (settings.visible_types && settings.visible_types.length > 0) {
            setVisibleTypes(settings.visible_types);
          }
          
          // 이수구분 순서 설정 적용
          if (settings.course_types_order && settings.course_types_order.length > 0) {
            setCourseTypes(settings.course_types_order);
          }
        } else {
          console.log('Supabase에 저장된 사용자 설정이 없어 로컬 스토리지에서 로드합니다.');
          
          // 로컬 스토리지에서 로드
          loadFromLocalStorage();
        }
        
        setSettingsLoaded(true);
      } catch (error) {
        console.error('사용자 설정 로드 실패:', error);
        // 오류 발생 시 로컬 스토리지에서 로드
        loadFromLocalStorage();
        setSettingsLoaded(true);
      }
    };
    
    // 로컬 스토리지에서 설정 로드하는 함수
    const loadFromLocalStorage = () => {
      try {
        const savedSemesters = localStorage.getItem('semesters');
        const savedVisibleTypes = localStorage.getItem('visibleTypes');
        const savedOrder = localStorage.getItem('courseTypesOrder');
        
        if (savedSemesters) {
          const parsedSemesters = JSON.parse(savedSemesters);
          setSemesters(parsedSemesters);
        }
        
        if (savedVisibleTypes) {
          const parsedVisibleTypes = JSON.parse(savedVisibleTypes);
          setVisibleTypes(parsedVisibleTypes);
        }
        
        if (savedOrder) {
          const parsedOrder = JSON.parse(savedOrder);
          setCourseTypes(parsedOrder);
        }
      } catch (e) {
        console.error('로컬 스토리지에서 설정 로드 실패:', e);
      }
    };
    
    if (userId && !settingsLoaded) {
      loadUserSettings();
    }
  }, [userId, settingsLoaded]);

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
    useSensor(MouseSensor, {
      // 마우스로 드래그 시작 설정 - 최소한의 이동 거리 필요
      activationConstraint: {
        distance: 5, // 5px 이상 움직여야 드래그 시작
      }
    }),
    useSensor(TouchSensor, {
      // 터치 디바이스에서 드래그 시작 설정 - 최소한의 이동 거리 필요
      activationConstraint: {
        delay: 100, // 터치 후 100ms 대기
        tolerance: 5, // 5px 이상 움직여야 드래그 시작
      }
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // 드롭 위치가 없으면 종료
    if (!over) return;
    
    // 드래그한 과목의 ID
    const courseId = active.id as string;
    
    // 지금의 구현에서 over.id는 드롭 위치의 과목 ID가 될 수 있음
    // 테이블 셀 드롭 데이터 형식: 'cell-semester-type'
    // 그래서 대상 셀의 정보를 정확히 알기 위해 data-cell 속성을 사용
    const targetCell = over.data.current?.cellInfo;
    
    if (targetCell) {
      // targetCell 형식: { semester: '2025년 상반기', type: '기교' }
      const { semester, type } = targetCell;
      
      // 현재 과목 정보 찾기
      const courseToMove = courses.find(course => course.id === courseId);
      if (!courseToMove) return;
      
      // 학기나 이수구분이 변경됐는지 확인
      if (courseToMove.semester === semester && courseToMove.type === type) {
        // 같은 셀 내에서의 순서 변경만 처리 (기존 로직)
        if (active.id !== over.id) {
          setCourses((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            
            const updatedCourses = arrayMove(items, oldIndex, newIndex);
            
            // 상위 컴포넌트에 변경 알림
            if (onCoursesUpdate) {
              onCoursesUpdate(updatedCourses);
            }
            
            return updatedCourses;
          });
        }
      } else {
        // 다른 셀로 이동하는 경우 (학기 또는 이수구분 변경)
        try {
          // 과목 정보 업데이트
          const updatedCourse = {
            ...courseToMove,
            semester,
            type
          };
          
          // Supabase 업데이트
          const result = await updateCourse(updatedCourse);
          if (result) {
            // 로컬 상태 업데이트
            const updatedCourses = courses.map(course => 
              course.id === courseId ? updatedCourse : course
            );
            setCourses(updatedCourses);
            
            // 상위 컴포넌트에 변경 알림
            if (onCoursesUpdate) {
              onCoursesUpdate(updatedCourses);
            }
          }
        } catch (error) {
          console.error('과목 이동 중 오류 발생:', error);
        }
      }
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

  const handleUpdateCourse = async (id: string, updates: {name?: string, credits?: number}) => {
    try {
      const courseToUpdate = courses.find(course => course.id === id);
      if (!courseToUpdate) return;

      const updatedCourse = {
        ...courseToUpdate,
        ...updates
      };

      const result = await updateCourse(updatedCourse);
      if (result) {
        const updatedCourses = courses.map(course => 
          course.id === id ? updatedCourse : course
        );
        setCourses(updatedCourses);
        if (onCoursesUpdate) {
          onCoursesUpdate(updatedCourses);
        }
      }
    } catch (error) {
      console.error('Error updating course:', error);
    }
  };

  // 설정을 Supabase에 저장하는 함수
  const saveSettings = async (updatedSettings: {
    semesters?: string[];
    visibleTypes?: string[];
    courseTypesOrder?: string[];
  }) => {
    try {
      // camelCase에서 snake_case로 명시적 변환
      console.log('받은 설정 업데이트 데이터:', updatedSettings);
      
      // 명시적으로 snake_case를 사용해 값 할당
      const settings = {
        user_id: userId,
        semesters: updatedSettings.semesters || semesters,
        visible_types: updatedSettings.visibleTypes || visibleTypes, // camelCase에서 snake_case로 매핑
        course_types_order: updatedSettings.courseTypesOrder || courseTypes // camelCase에서 snake_case로 매핑
      };
      
      console.log('saveSettings 호출 - 설정 저장 시도:', settings);
      
      // 저장 요청할 때 각 필드 로깅
      console.log('visible_types 값:', settings.visible_types);
      console.log('course_types_order 값:', settings.course_types_order);
      
      // Supabase에 설정 저장
      const result = await saveUserSettings(settings);
      
      if (result) {
        console.log('설정 저장 성공');
      } else {
        console.warn('설정 저장 실패, 자세한 오류는 콘솔 확인');
      }
    } catch (error) {
      console.error('설정 저장 중 오류 발생:', error);
    }
  };

  const handleSemestersChange = async (updatedSemesters: string[]) => {
    setSemesters(updatedSemesters);
    
    // 로컬 스토리지에 백업 저장
    localStorage.setItem('semesters', JSON.stringify(updatedSemesters));
    
    // Supabase에 설정 저장
    saveSettings({ semesters: updatedSemesters });
  };

  const handleVisibleTypesChange = async (types: string[]) => {
    setVisibleTypes(types);
    
    // 로컬 스토리지에 백업 저장
    localStorage.setItem('visibleTypes', JSON.stringify(types));
    
    // Supabase에 설정 저장
    saveSettings({ visibleTypes: types });
    
    // 로컬 스토리지에서 순서 불러와 적용
    try {
      const savedOrder = localStorage.getItem('courseTypesOrder');
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        let newOrder = [...parsedOrder];
        courseTypes.forEach(type => {
          if (!newOrder.includes(type)) {
            newOrder.push(type);
          }
        });
        newOrder = newOrder.filter(type => courseTypes.includes(type));
        setCourseTypes(newOrder);
        
        // 순서도 함께 저장
        saveSettings({ 
          visibleTypes: types,
          courseTypesOrder: newOrder
        });
      }
    } catch (e) {
      console.error('이수구분 순서 적용 오류:', e);
    }
  };
  
  // 이수구분 순서 변경 처리
  const handleCourseTypesOrderChange = async (newOrder: string[]) => {
    setCourseTypes(newOrder);
    localStorage.setItem('courseTypesOrder', JSON.stringify(newOrder));
    
    // Supabase에 설정 저장
    saveSettings({ courseTypesOrder: newOrder });
  };

  // 이수구분 드래그 앤 드롭 처리를 위한 설정(CourseTypeManager에서 사용)
  const handleDragEndCourseType = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = courseTypes.indexOf(active.id as string);
      const newIndex = courseTypes.indexOf(over.id as string);
      
      const newOrderedTypes = arrayMove(courseTypes, oldIndex, newIndex);
      handleCourseTypesOrderChange(newOrderedTypes);
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case '기교': return 'bg-amber-50/50 hover:bg-amber-50/70';
      case '심교': return 'bg-rose-50/50 hover:bg-rose-50/70';
      case '지교': return 'bg-sky-50/50 hover:bg-sky-50/70';
      case '지필': return 'bg-sky-100/50 hover:bg-sky-100/70';
      case '전필': return 'bg-emerald-100/50 hover:bg-emerald-100/70';
      case '전선': return 'bg-emerald-50/50 hover:bg-emerald-50/70';
      case '전기': return 'bg-emerald-50/70 hover:bg-emerald-50/90';
      case '일선': return 'bg-gray-50/50 hover:bg-gray-50/70';
      case '교직': return 'bg-violet-50/50 hover:bg-violet-50/70';
      case '반교': return 'bg-orange-50/50 hover:bg-orange-50/70';
      default: return 'bg-gray-50/50 hover:bg-gray-50/70';
    }
  };

  // 년도와 학기 정보를 학년 학기 형식으로 변환
  const semesterToGradeFormat = (semester: string) => {
    if (semester.includes('계절학기')) return null;
    
    // 순서대로 학년-학기 계산
    const index = semesters
      .filter(sem => !sem.includes('계절학기'))
      .findIndex(sem => sem === semester);
    
    if (index === -1) return null;
    
    // 0, 1 -> 1학년 1학기, 1학년 2학기
    // 2, 3 -> 2학년 1학기, 2학년 2학기
    const grade = Math.floor(index / 2) + 1;
    const semNumber = (index % 2) + 1;
    
    return `${grade}학년 ${semNumber}학기`;
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
          onOrderChange={handleCourseTypesOrderChange}
        />
      </div>
      
      {loading ? (
        <div className="w-full p-10 text-center">
          <p>데이터를 불러오는 중...</p>
        </div>
      ) : (
        <DndContext 
          sensors={sensors} 
          onDragEnd={handleDragEnd}
        >
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
                      <div>{semester}</div>
                      {!semester.includes('계절학기') && (
                        <div className="text-xs mt-1 font-normal text-gray-600">
                          {semesterToGradeFormat(semester)}
                        </div>
                      )}
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
                      <DroppableCell
                        key={semester}
                        semester={semester}
                        type={type}
                        style={getTypeStyle(type)}
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
                                  onUpdate={handleUpdateCourse}
                                  onDelete={handleDeleteCourse}
                                />
                              </div>
                            ))}
                        </SortableContext>
                      </DroppableCell>
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