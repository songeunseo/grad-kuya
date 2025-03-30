import React from 'react';

interface CreditRequirement {
  type: string;
  required: number;
  completed: number;
  remaining: number;
}

const GraduationCalculator: React.FC = () => {
  const creditTypes = [
    { name: '기교', required: 12 },
    { name: '심교', required: 15 },
    { name: '지교', required: 18 },
    { name: '지필', required: 2 },
    { name: '전선', required: 72 },
    { name: '일선', required: 13 },
  ];

  const semesters = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

  return (
    <div className="mt-8 bg-white p-4 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">졸업 계산기</h2>
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-gray-50">
            <th className="border-b-2 border-gray-200 p-3 text-sm font-semibold text-gray-600">이수구분</th>
            <th className="border-b-2 border-gray-200 p-3 text-sm font-semibold text-gray-600">기준학점</th>
            {semesters.map((semester, index) => (
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
              {semesters.map((_, i) => (
                <td key={i} className="border-b border-gray-100 p-2 text-center">
                  <input
                    type="number"
                    className="w-12 bg-white/70 text-center rounded border border-gray-200 p-1"
                    min="0"
                    max="24"
                  />
                </td>
              ))}
              <td className="border-b border-gray-100 p-3 text-center">0</td>
            </tr>
          ))}
          <tr className="bg-gray-100 font-bold">
            <td className="border-b border-gray-100 p-3">총점</td>
            <td className="border-b border-gray-100 p-3 text-center">132</td>
            {semesters.map((_, i) => (
              <td key={i} className="border-b border-gray-100 p-3 text-center">0</td>
            ))}
            <td className="border-b border-gray-100 p-3 text-center">0</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default GraduationCalculator; 