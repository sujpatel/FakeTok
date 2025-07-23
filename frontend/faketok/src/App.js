import React, { useState, useEffect } from 'react';


function App() {

  const [url, setUrl] = useState("");
  const [data, setData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP Error, status: ${response.status}`);
      }
      const result = await response.json();
      console.log(result);
      setData(result);
      setUrl("");
    } catch (error) {
      console.error("Error during fetch:", error);
    }



  }

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 mt-16 px-4">
        <input type="text"
          placeholder="Paste TikTok URL here!" value={url} onChange={(e) => setUrl(e.target.value)} className="w-[90vw] max-w-2xl px-4 py-3 mb-10 bg-[#010101] text-white  border-[#69C9D0] border-[2px] placeholder-[#EE1D52] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#69C9D0]   transition"></input>
        <button type="submit" className="px-6 py-3 font-semibold text-white bg-[#EE1D52] hover:bg-[#d81a4b] rounded-xl transition">Analyze</button>
      </form>

    </div >
  );
}

export default App;
