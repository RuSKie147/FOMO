from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import vibe_check, upload, events, auth_mock
import os

app = FastAPI(title="FOMO API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vibe_check.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(events.router, prefix="/api/events")
app.include_router(auth_mock.router, prefix="/api/auth")

@app.get("/")
def read_root():
    return {"message": "FOMO API running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.local_server:app", host="0.0.0.0", port=8000, reload=True)
