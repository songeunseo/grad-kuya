import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import '../styles/modal.css'; // 모달 스타일 임포트

interface CourseTypeManagerProps {
  allTypes: string[];
  visibleTypes: string[];
  onVisibleTypesChange: (types: string[]) => void;
  onOrderChange?: (types: string[]) => void;
}

// 드래그 가능한 이수구분 아이템 컴포넌트
const SortableTypeItem = ({ type, isSelected, getTypeColor, onToggle }: { 
  type: string, 
  isSelected: boolean, 
  getTypeColor: (type: string) => string,
  onToggle: () => void
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: type });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        ${getTypeColor(type)}
        ${isSelected ? 'border-2' : 'border opacity-50'}
        p-3 rounded-md cursor-pointer transition-all
      `}
    >
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="mr-3 h-4 w-4 text-blue-600"
          onClick={(e) => e.stopPropagation()}
        />
        <span className="font-medium">{type}</span>
        <div 
          {...listeners} 
          className="ml-auto cursor-grab"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const CourseTypeManager: React.FC<CourseTypeManagerProps> = ({ 
  allTypes, 
  visibleTypes, 
  onVisibleTypesChange,
  onOrderChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(visibleTypes);
  const [orderedTypes, setOrderedTypes] = useState<string[]>(allTypes);

  // visibleTypes prop이 변경되면 selectedTypes 상태를 업데이트
  useEffect(() => {
    setSelectedTypes(visibleTypes);
  }, [visibleTypes]);

  // 드래그 앤 드롭을 위한 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    // localStorage에서 저장된 순서가 있으면 불러오기
    const savedOrder = localStorage.getItem('courseTypesOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        // 저장된 순서에 새로운 타입이 있으면 마지막에 추가
        const newOrder = [...parsedOrder];
        allTypes.forEach(type => {
          if (!newOrder.includes(type)) {
            newOrder.push(type);
          }
        });
        setOrderedTypes(newOrder);
      } catch (e) {
        console.error('Error parsing saved order:', e);
        setOrderedTypes(allTypes);
      }
    } else {
      setOrderedTypes(allTypes);
    }
  }, [allTypes]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      // 모달이 열릴 때 현재 visibleTypes로 상태 초기화
      setSelectedTypes([...visibleTypes]);
    }
  };

  const handleToggleType = (type: string) => {
    const newSelectedTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newSelectedTypes);
  };

  const handleApply = () => {
    // 저장된 순서에 따라 선택된 타입의 순서를 조정
    const orderedSelectedTypes = orderedTypes.filter(type => selectedTypes.includes(type));
    onVisibleTypesChange(orderedSelectedTypes);
    // 순서 localStorage에 저장
    localStorage.setItem('courseTypesOrder', JSON.stringify(orderedTypes));
    setIsModalOpen(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const newOrderedTypes = arrayMove(
        orderedTypes,
        orderedTypes.indexOf(active.id as string),
        orderedTypes.indexOf(over.id as string)
      );
      
      setOrderedTypes(newOrderedTypes);
      
      // 드래그로 순서 변경하면 즉시 localStorage에 저장하고 적용
      localStorage.setItem('courseTypesOrder', JSON.stringify(newOrderedTypes));
      
      // 상위 컴포넌트에 순서 변경 알림 (prop 있는 경우만)
      if (onOrderChange) {
        onOrderChange(newOrderedTypes);
      }
      
      // 현재 선택된 항목들의 순서도 업데이트
      const newOrderedSelectedTypes = newOrderedTypes.filter(type => selectedTypes.includes(type));
      if (JSON.stringify(newOrderedSelectedTypes) !== JSON.stringify(selectedTypes)) {
        setSelectedTypes(newOrderedSelectedTypes);
        onVisibleTypesChange(newOrderedSelectedTypes);
      }
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case '기교': return 'bg-amber-50 border-amber-200';
      case '심교': return 'bg-rose-50 border-rose-200';
      case '지교': return 'bg-sky-50 border-sky-200';
      case '지필': return 'bg-sky-100 border-sky-300';
      case '전필': return 'bg-emerald-100 border-emerald-300';
      case '전선': return 'bg-emerald-50 border-emerald-200';
      case '전기': return 'bg-emerald-200 border-emerald-400';
      case '일선': return 'bg-gray-50 border-gray-200';
      case '교직': return 'bg-violet-50 border-violet-200';
      case '반교': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div>
      <button
        onClick={toggleModal}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        이수구분 관리
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">이수구분 관리</h3>
              <button
                onClick={toggleModal}
                className="modal-close-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 mb-6">
              <div className="text-sm text-gray-600 mb-2">
                표시할 이수구분을 선택하세요 (현재 {selectedTypes.length}개 선택, 드래그하여 순서 변경)
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={orderedTypes} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {orderedTypes.map((type) => (
                      <SortableTypeItem
                        key={type}
                        type={type}
                        isSelected={selectedTypes.includes(type)}
                        getTypeColor={getTypeColor}
                        onToggle={() => handleToggleType(type)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={toggleModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseTypeManager; 