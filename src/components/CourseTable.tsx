import React, { useState } from 'react';
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

interface Course {
  id: string;
  name: string;
  type: string;
  credits: number;
  semester: string;
}

const CourseTable: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: '1',
      name: '영어사회봉사러닝',
      type: '기교',
      credits: 3,
      semester: '2024년 상반기'
    },
    // 더 많은 과목들을 추가할 수 있습니다
  ]);

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

  const semesters = [
    '2023년 상반기', '2023년 하반기', '2024년 상반기', '2024년 하반기',
    '2025년 상반기', '2025년 하반기', '2026년 상반기', '2026년 하반기',
    '2027년 상반기', '2027년 하반기'
  ];

  const courseTypes = ['기교', '심교', '지교(반교)', '전선', '일선'];

  const getTypeStyle = (type: string) => {
    switch (type) {
      case '기교': return 'bg-amber-50/50 hover:bg-amber-50/70';
      case '심교': return 'bg-rose-50/50 hover:bg-rose-50/70';
      case '지교(반교)': return 'bg-sky-50/50 hover:bg-sky-50/70';
      case '전선': return 'bg-emerald-50/50 hover:bg-emerald-50/70';
      default: return 'bg-gray-50/50 hover:bg-gray-50/70';
    }
  };

  return (
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
                          <DraggableCourse
                            key={course.id}
                            id={course.id}
                            name={course.name}
                            type={course.type}
                            credits={course.credits}
                          />
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
  );
};

export default CourseTable; 