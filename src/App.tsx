import React from 'react'
import CourseTable from './components/CourseTable'
import GraduationCalculator from './components/GraduationCalculator'
import logo from './assets/logo.svg'

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">
        <img src={logo} alt="logo" className="w-32 mx-auto mb-4" />
      </h1>
      <div className="space-y-8">
        <CourseTable />
        <GraduationCalculator />
      </div>
    </div>
  )
}

export default App
