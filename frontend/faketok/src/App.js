import React, { useState, useEffect } from 'react';


function App() {

  const [url, setUrl] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      alert("Please enter a TikTok URL.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("https://faketok.onrender.com/analyze", {
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
      console.log("Processing time:", result.processing_time ?? "N/A");
      setUrl("");
    } catch (error) {
      console.error("Error during fetch:", error);
    } finally {
      setLoading(false);
    }




  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white">
      <div className="text-center mt-12">
        <h1 className="text-4xl font-bold text-[#EE1D52] mb-2">Welcome to FakeTok</h1>
        <p className="text-lg text-zinc-400">Turning TikTok videos into verified truth.</p>
      </div>
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
            disabled={loading}
            className={`px-6 py-3 font-semibold text-white rounded-xl transition ${loading ? "bg-[#d81a4b] opacity-60 cursor-not-allowed" : "bg-[#EE1D52] hover:bg-[#d81a4b]"}`}>{loading ? "Analyzing..." : "Analyze"}</button>
        </form>
      ) : (
        <div className="w-full max-w-3xl space-y-6">
          <h2 className="text-2xl font-bold text-[#69C9D0]">Transcript</h2>
          <div className="text-lg leading-relaxed flex flex-wrap gap-1">
            {data.transcript
              ?
              renderAnnotatedTranscript(data.transcript, data.false_claims) : <p className="text-zinc-400 italic">{data.reason}</p>}
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
  return (
    <div className="space-y-6">

      <div className="whitespace-pre-wrap">{transcript}</div>
      {claims && claims.length > 0 && (
        <details className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
          <summary className="cursor-pointer text-[#EE1D52] font-semibold text-lg">
            False Claims Detected ({claims.length})
          </summary>
          <ul className="mt-4 space-y-4">
            {claims.map((claimObj, idx) => (
              <li
                key={idx}
                className="bg-zinc-900 p-4 rounded-lg border border-zinc-700">
                <div className="text-red-400 font-semibold mb-1">
                  🔴 Claim {idx + 1}:
                </div>
                <div className="text-white mb-2">
                  <span className="italic">"{claimObj.claim}"</span>
                </div>
                <div className="text-zinc-300">{claimObj.grounded_explanation}</div>

                <div className="mt-2">
                  {claimObj.source?.url ? (
                    <a
                      href={claimObj.source.url}
                      target="_blank"
                      rel="npopener noreferrer"
                      className="text-[#69C9D0] underline hover:text-[#69C9D0]/80"
                    >
                      📚 Source: {claimObj.source.title || "View Source"}
                    </a>
                  ) : (
                    <p className="text-zinc-500 italic">No source found - LLM Generated explanation</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default App;
