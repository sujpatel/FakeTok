from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from yt_dlp import YoutubeDL
import os
import subprocess
import whisper
import requests
from dotenv import load_dotenv
import time

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GOOGLE_FACTCHECK_API_KEY = os.getenv("GOOGLE_FACTCHECK_API_KEY")

app = FastAPI()

origins = [
    
    "http://localhost:3000"
    "https://faketok-frontend.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def download_tiktok_video(url):
    os.makedirs('downloads', exist_ok=True)
    ydl_opts = {
        'outtmpl': 'downloads/%(id)s.%(ext)s',
        'format' : 'bestvideo+bestaudio/best',
        'merge_output_format': 'mp4',
    }
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        file_path = ydl.prepare_filename(info)
        return info['id'], file_path

def extract_audio(video_path, output_audio_path):
    command = [
        "ffmpeg",
        "-i", video_path,
        "-vn",
        "-acodec", "mp3",
        output_audio_path
    ]
    subprocess.run(command, check=True)
    
def call_mistral(messages, temperature=0.2):
    time.sleep(2)
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "model": "mistralai/mistral-7b-instruct:free",
        "messages": messages,
        "temperature": temperature
    }
    response = requests.post("https://openrouter.ai/api/v1/chat/completions", json=data, headers=headers)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()

def classify_and_detect(transcript):
    messages = [
        {
            "role": "user",
            "content": f"""
You're a fact-checking assistant.

Classify the transcript as one of:
- music
- speech_claims
- speech_casual

If speech_claims, extract up to 5 false or misleading claims. For each, say why it's wrong.

Return:
[{{"claim": "...", "explanation": "..."}}]

Transcript:
\"\"\"{transcript}\"\"\"
"""

    }
        ]
    return call_mistral(messages)


def get_sources_for_claim(claim):
    results = []
    scholar_url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={claim}&limit=2&fields=title,url"
    scholar_response = requests.get(scholar_url)
    if scholar_response.status_code == 200:
        for paper in scholar_response.json().get("data", []):
            results.append({
                "title": paper["title"],
                "url": paper["url"],
                "source": "Semantic Scholar"
            })
            
    fact_check_url = f"https://factchecktools.googleapis.com/v1alpha1/claims:search?query={claim}&key={GOOGLE_FACTCHECK_API_KEY}"
    fact_response  = requests.get(fact_check_url)
    if fact_response.status_code == 200:
        data = fact_response.json()
        for claim in data.get("claims", []):
            results.append({
                "title": claim.get("text", "Unknown"),
                "url": claim.get("claimReview", [{}])[0].get("url", ""),
                "source": "Google Fact Check"
            })
   
    return results 

def generate_grounded_explanation(claim, source_title, source_url):
    prompt = f"""
    A TikTok video claims: "{claim}".
    
    Debunk this using the source: "{source_title}" at {source_url}. Write a short paragraph (2-3 sentences) explaining why this claim is false. Use an informative tone with a citation.
    """
    return call_mistral([{"role": "user", "content": prompt}])

class UrlInput(BaseModel):
    url: str

@app.post("/analyze")
async def analyze_url(data: UrlInput):
    start_time = time.time()
    video_id = None
    path = None
    audio_path = None
    
    try:
        video_id, path = download_tiktok_video(data.url)
    
        audio_path = f"downloads/{video_id}.mp3"
        extract_audio(path, audio_path)
    
        model = whisper.load_model("base")
        result = model.transcribe(audio_path)
        transcript = result["text"].strip()
    
        if not transcript or len(transcript.split()) < 5:
            end_time = time.time()
            duration = round(end_time - start_time, 2)
            return {"status": "non_verbal", "reason": "Too little spoken content.", "processing_time": duration}
    
        raw_response = classify_and_detect(transcript)
    
        if "music" in raw_response.lower():
            return {"status": "music", "reason": "Detected as lyrics or music, not speech"}
    
        if "speech_casual" in raw_response.lower():
            return {"status": "speech_non_claim", "reason": "Detected as casual or non-claim speech", "transcript": transcript, "false_claims": []}
    
        try:
            import json
            claims_list = json.loads(raw_response)
        except:
            claims_list = []
    
        enriched_claims = []
    
        for claim_entry in claims_list[:5]:
            claim_text = claim_entry["claim"]
            explanation = claim_entry["explanation"]
        
            if len(claim_text.split()) < 4:
                continue
        
            sources = get_sources_for_claim(claim_text)
        
            if sources:
                source = sources[0]
                grounded_expl = generate_grounded_explanation(claim_text, source["title"], source["url"])
            else:
                source = {}
                grounded_expl = explanation
        
            enriched_claims.append({
                "claim": claim_text,
                "grounded_explanation": grounded_expl,
                "source": source
            })
    
        if os.path.exists(path):
            os.remove(path)
        if os.path.exists(audio_path):
            os.remove(audio_path)
        
        end_time = time.time()
        duration = round(end_time - start_time, 2)
    
        return {
            "status": "speech", 
            "video_id": video_id,
            "transcript": transcript,
            "false_claims": enriched_claims,
            "processing_time": duration
            }
    finally:
        if path and os.path.exists(path):
            os.remove(path)
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)





