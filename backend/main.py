from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from yt_dlp import YoutubeDL
import os
import subprocess
import whisper

app = FastAPI()

origins = [
    
    "http://localhost:3000"
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

class UrlInput(BaseModel):
    url: str

@app.post("/analyze")
async def analyze_url(data: UrlInput):
    video_id, path = download_tiktok_video(data.url)
    
    audio_path = f"downloads/{video_id}.mp3"
    extract_audio(path, audio_path)
    
    model = whisper.load_model("base")
    result = model.transcribe(audio_path)
    
    return {
        "status": "success", 
        "video_id": video_id,
        "file_path": path,
        "audio_file": audio_path,
        "transcription": result["text"]
        }





