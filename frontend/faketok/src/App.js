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
    <div>
      <form onSubmit={handleSubmit}>
        <input value={url} onChange={(e) => setUrl(e.target.value)}></input>
        <button type="submit">Analyze</button>
      </form>

    </div >
  );
}

export default App;
