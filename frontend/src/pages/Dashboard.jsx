import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

const apiUrl = "https://pulse-assesment-backend.onrender.com";



  const fetchVideos = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get(`${apiUrl}/api/videos`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setVideos(res.data);
    } catch (err) {
      setError("Failed to load videos. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this video?")) return;
    try {
      await axios.delete(`${apiUrl}/api/videos/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setVideos(videos.filter(v => v._id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleEditTitle = async (video) => {
    const newTitle = prompt("New title:", video.title);
    if (!newTitle) return;
    try {
      const res = await axios.put(`${apiUrl}/api/videos/${video._id}`, 
        { title: newTitle },
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
      setVideos(videos.map(v => v._id === video._id ? res.data : v));
    } catch (err) {
      alert("Update failed");
    }
  };

  const toggleStatus = async (video) => {
    const nextStatus = video.status === "safe" ? "flagged" : "safe";
    try {
      const res = await axios.put(`${apiUrl}/api/videos/${video._id}`, 
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
      setVideos(videos.map(v => v._id === video._id ? res.data : v));
    } catch (err) {
      alert("Status update failed");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Videos...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Video Library</h2>
          <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold uppercase">
            {user?.user?.role}
          </span>
        </div>
        
        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">{error}</div>
        ) : videos.length === 0 ? (
          <p className="text-gray-500">No videos found. Upload one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video._id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col">
                <div className="aspect-video bg-black mb-3 rounded overflow-hidden">
                   <video 
                     src={`${apiUrl}/api/videos/${video._id}?token=${user.token}`} 
                     controls 
                     className="w-full h-full"
                   />
                </div>
                <h3 className="font-bold truncate">{video.title}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                    video.status === 'safe' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {video.status}
                  </span>
                  <span className="text-xs text-gray-400">{video.progress}%</span>
                </div>

                {/* Role Based Buttons */}
                <div className="mt-4 pt-4 border-t flex gap-2">
                  {(user?.user?.role === "admin" || (user?.user?.role === "editor" && video.uploadedBy === user.user.id)) && (
                    <>
                      <button onClick={() => handleEditTitle(video)} className="text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded">Edit</button>
                      <button onClick={() => handleDelete(video._id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded">Delete</button>
                    </>
                  )}
                  {user?.user?.role === "admin" && (
                    <button onClick={() => toggleStatus(video)} className="text-xs bg-blue-600 text-white p-2 rounded">Toggle Status</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}