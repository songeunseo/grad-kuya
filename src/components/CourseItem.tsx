import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CourseProps {
  id: string;
  name: string;
  type: string;
  credits: number;
  Advanced_tag?: '선도적세계인' | '실천적사회인' | '창의적전문인';
  Basic_tag?: '글쓰기' | '외국어' | 'S/W' | '인성';
}

export const CourseItem: React.FC<CourseProps> = ({ id, name, type, credits, Advanced_tag, Basic_tag }) => {
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
      case '기교': return 'bg-amber-50 border-amber-100';
      case '심교': return 'bg-rose-50 border-rose-100';
      case '지교': return 'bg-sky-50 border-sky-100';
      case '지필': return 'bg-sky-100 border-sky-200';
      case '전필': return 'bg-emerald-100 border-emerald-200';
      case '전선': return 'bg-emerald-50 border-emerald-100';
      case '전기': return 'bg-emerald-200 border-emerald-300';
      case '교직': return 'bg-violet-50 border-violet-100';
      case '반교': return 'bg-orange-50 border-orange-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  const getTagColor = (type: string) => {
    switch (type) {
      case '기교': return 'bg-amber-100 border-amber-200 text-amber-800';
      case '심교': return 'bg-rose-100 border-rose-200 text-rose-800';
      case '지교': return 'bg-sky-100 border-sky-200 text-sky-800';
      case '지필': return 'bg-sky-200 border-sky-300 text-sky-900';
      case '전필': return 'bg-emerald-100 border-emerald-200 text-emerald-800';
      case '전선': return 'bg-emerald-50 border-emerald-100 text-emerald-700';
      case '전기': return 'bg-emerald-200 border-emerald-300 text-emerald-900';
      case '교직': return 'bg-violet-100 border-violet-200 text-violet-800';
      case '반교': return 'bg-orange-100 border-orange-200 text-orange-800';
      default: return 'bg-white border-gray-200 text-gray-600';
    }
  };

  // 6자 이상이면 ...으로 표시
  const truncateName = (name: string) => {
    if (name.length > 6) {
      return name.slice(0, 6) + '...';
    }
    return name;
  };

  // 태그가 있는지 확인
  const hasTag = Advanced_tag || (type === '기교' && Basic_tag) || type === '심교';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        ${getTypeColor(type)} 
        border 
        ${hasTag ? 'p-2.5 mb-2' : 'py-1.5 px-2.5 mb-1'} 
        rounded-lg 
        shadow-sm 
        cursor-move 
        hover:shadow-md 
        transition-shadow
        duration-200
      `}
      title={name}
    >
      {hasTag ? (
        <>
          <div className="text-sm font-semibold text-gray-800">{truncateName(name)}</div>
          <div className="text-xs mt-1 text-gray-600 flex justify-between">
            {(Advanced_tag || (type === '기교' && Basic_tag)) ? (
              <span className={`${getTagColor(type)} px-2 py-0.5 rounded-full text-[10px] font-medium border`}>
                {Advanced_tag || Basic_tag}
              </span>
            ) : (
              <span></span>
            )}
            <span className="bg-white px-2 py-0.5 rounded-full text-gray-600 text-[10px] font-bold">
              {credits}학점
            </span>
          </div>
        </>
      ) : (
        <div className="flex justify-between items-center">
          <div className="text-sm font-semibold text-gray-800 truncate max-w-[70%]">{truncateName(name)}</div>
          <span className="bg-white ml-1 px-1.5 py-0.5 rounded-full text-gray-600 text-[10px] font-bold whitespace-nowrap">
            {credits}학점
          </span>
        </div>
      )}
    </div>
  );
}; 