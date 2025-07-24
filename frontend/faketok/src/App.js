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
      {!data ? (
        <form
          onSubmit={handleSubmit} className="flex flex-col items-center gap-4 mt-16 px-4">
          <input
            type="text"
            placeholder="Paste TikTok URL here!"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-[90vw] max-w-2xl px-4 py-3 mb-10 bg-zinc-900 text-white  border-[#69C9D0] border-[2px] placeholder-[#EE1D52] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#69C9D0]   transition">
          </input>
          <button
            type="submit"
            className="px-6 py-3 font-semibold text-white bg-[#EE1D52] hover:bg-[#d81a4b] rounded-xl transition">Analyze</button>
        </form>
      ) : (
        <div className="w-full max-w-3xl space-y-6">
          <h2 className="text-2xl font-bold text-[#69C9D0]">Transcript</h2>
          <div className="text-lg leading-relaxed flex flex-wrap gap-1">
            {renderAnnotatedTranscript(data.transcript, data.false_claims)}
          </div>

          <button onClick={() => setData(null)}
            className="mt-6 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-sm"
          >
            Analyze Another Video
          </button>
        </div>
      )}
    </div >
  );
}

function renderAnnotatedTranscript(transcript, claims) {
  if (!claims || claims.length === 0) return transcript;

  const fragments = [];
  let current = transcript;

  claims.forEach(({ claim, grounded_explanation, source }) => {
    const index = current.toLowerCase().indexOf(claim.toLowerCase());
    if (index === -1) return;

    const before = current.slice(0, index);
    const match = current.slice(index, index + claim.length);
    const after = current.slice(index + claim.length);

    if (before) fragments.push(before);

    fragments.push(
      <span
        key={match + Math.random()}
        className="underline decoration-[#EE1D52] decoration-2 cursor-pointer group relative">
        {match}
        <span className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block bg-zinc-800 text-sm text-white p-2 rounded-lg w-72 shadow-xl">
          {grounded_explanation}
          {source?.url && (
            <div className="mt-2">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#69C9D0] underline"
              >
                Source: {source.title}
              </a>
            </div>
          )}
        </span>
      </span>
    );
    current = after;
  });
  if (current) fragments.push(current);
  return fragments;
}
export default App;
