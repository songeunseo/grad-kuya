import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-12 py-8 bg-gray-100 border-t border-gray-200 w-full">
      <div className="container mx-auto px-4 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center w-full">
          <div className="mb-6 md:mb-0">
            <h3 className="text-xl font-bold mb-3 text-gray-700">졸업할KU야</h3>
            <p className="text-sm text-gray-600">
              ⓒ {currentYear} 졸업할KU야
            </p>
            <p className="text-xs text-gray-500 mt-2">
              건국대학교 학생들을 위한 졸업 이수학점 관리 시스템
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-center md:flex md:space-x-8">
            <div className="flex flex-col items-center">
              <h4 className="text-sm font-semibold mb-2 text-gray-700">서비스</h4>
              <div className="flex flex-col space-y-2">
                <a href="#" className="text-xs text-gray-600 hover:text-gray-800 transition-colors">
                  사용 가이드
                </a>
                <a href="#" className="text-xs text-gray-600 hover:text-gray-800 transition-colors">
                  FAQ
                </a>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <h4 className="text-sm font-semibold mb-2 text-gray-700">법적 고지</h4>
              <div className="flex flex-col space-y-2">
                <a href="#" className="text-xs text-gray-600 hover:text-gray-800 transition-colors">
                  개인정보처리방침
                </a>
                <a href="#" className="text-xs text-gray-600 hover:text-gray-800 transition-colors">
                  이용약관
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            본 서비스는 건국대학교의 공식 서비스가 아닙니다. 학사 정보는 공식 학교 웹사이트를 참고하세요.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
