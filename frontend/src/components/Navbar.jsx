import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">PulseVideo</Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
            
            {(user?.user?.role === "editor" || user?.user?.role === "admin") && (
              <Link to="/upload" className="text-gray-700 hover:text-blue-600">Upload</Link>
            )}

          
            {user?.user?.role === "admin" && (
              <Link to="/admin/users" className="bg-red-50 text-red-600 px-3 py-1 rounded-md font-medium">Admin Panel</Link>
            )}

            <button 
              onClick={handleLogout}
              className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}