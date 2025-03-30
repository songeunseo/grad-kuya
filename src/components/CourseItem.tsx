import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CourseProps {
  id: string;
  name: string;
  type: string;
  credits: number;
  Advanced_tag?: '선도적세계인' | '실천적사회인' | '창의적전문인';
  Basic_tag?: '글쓰기' | '외국어' | 'S/W' | '인성' | '취창업';
  onUpdate?: (id: string, updates: {name?: string, credits?: number}) => void;
}

export const CourseItem: React.FC<CourseProps> = ({ 
  id, 
  name, 
  type, 
  credits, 
  Advanced_tag, 
  Basic_tag,
  onUpdate
}) => {
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

  // 컨텍스트 메뉴 상태
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // 수정 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editCredits, setEditCredits] = useState(credits);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case '기교': return 'bg-amber-50 border-amber-100';
      case '심교': return 'bg-rose-50 border-rose-100';
      case '지교': return 'bg-sky-50 border-sky-100';
      case '지필': return 'bg-sky-100 border-sky-200';
      case '전필': return 'bg-emerald-100 border-emerald-200';
      case '전선': return 'bg-emerald-50 border-emerald-100';
      case '전기': return 'bg-emerald-50 border-emerald-100';
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

  // 우클릭 이벤트 핸들러
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  // 수정 모드 시작
  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(name);
    setEditCredits(credits);
  };

  // 수정 저장
  const handleSaveEdit = () => {
    if (onUpdate && (editName !== name || editCredits !== credits)) {
      onUpdate(id, {
        name: editName.trim() === '' ? name : editName,
        credits: editCredits
      });
    }
    setIsEditing(false);
  };

  // 수정 모드 UI 렌더링
  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`
          ${getTypeColor(type)} 
          border 
          p-2.5
          rounded-lg 
          shadow-sm 
          mb-2
          hover:shadow-md 
          transition-shadow
          duration-200
        `}
      >
        <div className="space-y-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full p-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex items-center">
            <span className="text-xs text-gray-600 mr-2">학점:</span>
            <input
              type="number"
              min="1"
              max="9"
              value={editCredits}
              onChange={(e) => setEditCredits(parseInt(e.target.value) || 1)}
              className="w-12 p-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-1">
            <button
              onClick={handleCancelEdit}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              취소
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
          relative
        `}
        title={name}
        onContextMenu={handleContextMenu}
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

      {/* 컨텍스트 메뉴 */}
      {showMenu && (
        <div
          ref={menuRef}
          className="fixed bg-white shadow-lg rounded-md py-1 z-50 border border-gray-200 min-w-[120px]"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
          }}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={handleEdit}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            수정
          </button>
        </div>
      )}
    </>
  );
}; 