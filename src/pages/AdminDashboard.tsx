import Navbar from '../components/Navbar';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Frequently used</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Creating class schedules */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <img 
                  src="https://images.pexels.com/photos/6863175/pexels-photo-6863175.jpeg"
                  alt="Schedule template"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900">Creating class schedules</h3>
                </div>
              </div>

              {/* Financial affairs */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <img 
                  src="https://images.pexels.com/photos/6863250/pexels-photo-6863250.jpeg"
                  alt="Financial documents"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900">Financial affairs</h3>
                </div>
              </div>

              {/* Creating class */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <img 
                  src="https://images.pexels.com/photos/5905498/pexels-photo-5905498.jpeg"
                  alt="Empty classroom"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900">Creating class</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}