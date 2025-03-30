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
import { getCourses, addCourse, deleteCourse, updateCourse, Course } from '../lib/supabase';

interface CourseTableProps {
  userId: string;
}

const CourseTable: React.FC<CourseTableProps> = ({ userId }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState<string[]>(['2025년 상반기', '2025년 하반기']);

  // Fetch courses from Supabase
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const fetchedCourses = await getCourses(userId);
        setCourses(fetchedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [userId]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setCourses((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
      
      // TODO: Update order in Supabase if needed
    }
  };

  const handleAddCourse = async (courseData: Omit<Course, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const newCourse = await addCourse({
        ...courseData,
        user_id: userId
      });
      
      if (newCourse) {
        setCourses([...courses, newCourse]);
      }
    } catch (error) {
      console.error('Error adding course:', error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const success = await deleteCourse(id);
      if (success) {
        setCourses(courses.filter(course => course.id !== id));
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
      <div className="flex gap-4 mb-4">
        <AddCourseForm onAddCourse={handleAddCourse} semesters={semesters} />
        <SemesterManager 
          semesters={semesters}
          onSemestersChange={handleSemestersChange}
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