import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import MainPanel from './pages/MainPanel';
import PrivateRoute from './components/PrivateRoute';
import Unauthorized from './pages/Unauthorized';
import Teachers from './pages/Admin panel/AdminTeachers';
import TeacherRegistration from './pages/Admin panel/TeacherRegistration';
import Terms from './pages/Admin panel/Terms';
import Courses from './pages/Admin panel/Courses';
import Classes from './pages/Admin panel/Classes';
import Students from './pages/Admin panel/Students';
import Schedule from './pages/Admin panel/Schedule';
import Grades from './pages/Admin panel/Grades';
import MainClasses from './pages/main Panel/MainClasses';
import MainGrades from './pages/main Panel/MainGrades';
import MainPayment from './pages/main Panel/MainPayment';
import RecordGrades from './pages/main Panel/RecordGrades';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/admin-dashboard"
          element={
            <PrivateRoute allowedRoles={['manager']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <PrivateRoute allowedRoles={['manager']}>
              <Teachers />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/teachers/new"
          element={
            <PrivateRoute allowedRoles={['manager']}>
              <TeacherRegistration />
            </PrivateRoute>
          }
        />
        <Route
        path='/admin/terms'
        element={
          <PrivateRoute allowedRoles={['manager']}>
            <Terms />
          </PrivateRoute>
        }
        />
        <Route
          path='/admin/courses'
          element={
            <PrivateRoute allowedRoles={['manager']}>
              <Courses />
            </PrivateRoute>
          }
        />
        <Route
          path='/admin/classes'
          element={
            <PrivateRoute allowedRoles={['manager']}>
              <Classes />
            </PrivateRoute>
          }
        />
        <Route
          path='/admin/students'
          element={
            <PrivateRoute allowedRoles={['manager']}>
              <Students />
            </PrivateRoute>
          }
        />
        <Route
          path='/admin/schedule'
          element={
            <PrivateRoute allowedRoles={['manager']}>
              <Schedule />
            </PrivateRoute>
          }
        />
        <Route
          path='/admin/grades'
          element={
            <PrivateRoute allowedRoles={['manager']}>
              <Grades />
            </PrivateRoute>
          }
        />
        <Route
          path='/classes'
          element={
            <PrivateRoute allowedRoles={['student', 'teacher']}>
              <MainClasses />
            </PrivateRoute>
          }
        />
        <Route
          path="/grades"
          element={
            <PrivateRoute allowedRoles={['student', 'teacher']}>
              <MainGrades />
            </PrivateRoute>
          }
        />
        <Route
          path="/main-panel"
          element={
            <PrivateRoute allowedRoles={['student', 'teacher']}>
              <MainPanel />
            </PrivateRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <PrivateRoute allowedRoles={['student']}>
              <MainPayment />
            </PrivateRoute>
          }
        />
        <Route
          path="/grades/record/:class_id"
          element={
            <PrivateRoute allowedRoles={['teacher']}>
              <RecordGrades />
            </PrivateRoute>
          }
        />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );

}

export default App;