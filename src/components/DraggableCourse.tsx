import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CourseProps {
  id: string;
  name: string;
  type: string;
  credits: number;
}

export const DraggableCourse: React.FC<CourseProps> = ({ id, name, type, credits }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case '기교': return 'bg-amber-50 border-amber-200';
      case '심교': return 'bg-rose-50 border-rose-200';
      case '지교': return 'bg-sky-50 border-sky-200';
      case '전선': return 'bg-emerald-50 border-emerald-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        ${getTypeColor(type)} 
        border 
        p-2.5 
        rounded-lg 
        shadow-sm 
        cursor-move 
        mb-2
        hover:shadow-md 
        transition-shadow
        duration-200
      `}
    >
      <div className="text-sm font-semibold text-gray-800">{name}</div>
      <div className="text-xs mt-1 text-gray-600 flex justify-end">
        <span className="bg-white px-2 py-0.5 rounded-full text-gray-600 text-[10px] font-bold">
          {credits}학점
        </span>
      </div>
    </div>
  );
}; 