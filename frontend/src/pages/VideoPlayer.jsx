import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function VideoPlayer() {
  const { id } = useParams();
  const apiUrl = "https://pulse-assesment-backend.onrender.com";

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Playing Video ID: {id}</h2>
        <video
          src={`${apiUrl}/api/video/${id}?t=${Date.now()}`}
          controls
          className="w-full max-w-4xl mx-auto rounded shadow"
        />
      </div>
    </>
  );
}
