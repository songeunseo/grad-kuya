import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-emerald-600">KU-GRAD</h1>
            <div className="space-x-4">
              <Link to="/login" className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition">
                로그인
              </Link>
              <Link to="/signup" className="px-6 py-2 border border-emerald-600 text-emerald-600 rounded-md hover:bg-emerald-50 transition">
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero-section py-20 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
                  학점 이수 계획을<br />더 쉽게 세우세요
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  고려대학교 학생들을 위한 최적의 학점 이수 계획 도구.
                  졸업까지 남은 학점을 한눈에 확인하고 관리하세요.
                </p>
                <Link to="/signup" className="px-8 py-3 bg-emerald-600 text-white text-lg rounded-md hover:bg-emerald-700 transition shadow-md">
                  지금 시작하기
                </Link>
              </div>
              <div className="md:w-1/2">
                <img src="/landing-hero.svg" alt="졸업 계획 이미지" className="w-full max-w-lg mx-auto" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">주요 기능</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="feature-card p-6 rounded-lg shadow-md">
                <div className="text-emerald-600 text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">학점 현황 대시보드</h3>
                <p className="text-gray-600">
                  이수한 학점과 남은 학점을 시각적으로 확인할 수 있는 대시보드를 제공합니다.
                </p>
              </div>
              <div className="feature-card p-6 rounded-lg shadow-md">
                <div className="text-emerald-600 text-4xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">이수 과목 관리</h3>
                <p className="text-gray-600">
                  이수한 과목과 예정된 과목을 쉽게 추가하고 관리할 수 있습니다.
                </p>
              </div>
              <div className="feature-card p-6 rounded-lg shadow-md">
                <div className="text-emerald-600 text-4xl mb-4">🎓</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">졸업 요건 확인</h3>
                <p className="text-gray-600">
                  고려대학교 졸업 요건에 맞추어 자신의 졸업 가능성을 한눈에 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">사용자 후기</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="testimonial-card p-6 bg-white rounded-lg shadow-md">
                <p className="text-gray-600 mb-4">
                  "이 앱 덕분에 남은 학점 계산이 훨씬 쉬워졌어요. 더 이상 학교 포털을 이리저리 뒤질 필요가 없네요!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold mr-3">JH</div>
                  <div>
                    <p className="font-semibold text-gray-800">정**</p>
                    <p className="text-sm text-gray-500">경영학과 3학년</p>
                  </div>
                </div>
              </div>
              <div className="testimonial-card p-6 bg-white rounded-lg shadow-md">
                <p className="text-gray-600 mb-4">
                  "졸업 요건 체크 기능이 정말 유용해요. 이제 어떤 과목을 들어야 할지 더 명확하게 계획할 수 있게 되었습니다."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold mr-3">SY</div>
                  <div>
                    <p className="font-semibold text-gray-800">이**</p>
                    <p className="text-sm text-gray-500">컴퓨터학과 4학년</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-emerald-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">지금 KU-GRAD와 함께 미래를 계획하세요</h2>
            <p className="text-xl mb-8">졸업까지의 여정을 더 명확하게, 더 효율적으로</p>
            <Link to="/signup" className="px-8 py-3 bg-white text-emerald-600 text-lg font-semibold rounded-md hover:bg-gray-100 transition shadow-md inline-block">
              무료로 시작하기
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold">KU-GRAD</h2>
              <p className="text-gray-400 mt-2">고려대학교 학생들을 위한 학점 관리 서비스</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">© 2024 KU-GRAD. All rights reserved.</p>
              <p className="text-gray-400 mt-2">문의: contact@ku-grad.com</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 