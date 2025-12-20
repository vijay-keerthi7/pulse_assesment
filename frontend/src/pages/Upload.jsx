import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import axios from "axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

export default function Upload() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const apiUrl ="https://pulse-assesment-backend.onrender.com";


  useEffect(() => {
    socket.on("processing-update", (data) => {
      setProcessingProgress(data.progress);
    });

    socket.on("processing-complete", (data) => {
      setProcessingProgress(100);
      setTimeout(() => {
        alert(`Analysis Complete: Video is ${data.status}`);
        navigate("/"); 
      }, 1000);
    });

    return () => {
      socket.off("processing-update");
      socket.off("processing-complete");
    };
  }, [navigate]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select a file");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("video", file);

    setIsUploading(true);
    try {
      await axios.post(`${apiUrl}/api/videos/upload`, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
    } catch (err) {
      alert("Upload failed");
      setIsUploading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Video</h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <input
              type="text"
              placeholder="Video Title"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            
            <input
              type="file"
              accept="video/*"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />

            {!isUploading ? (
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                Start Upload & Analysis
              </button>
            ) : (
              <div className="space-y-4 text-center">
               
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500" 
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm font-medium text-blue-600 animate-pulse">
                  {processingProgress < 100 
                    ? `Analyzing Content... ${processingProgress}%` 
                    : "Finalizing..."}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}