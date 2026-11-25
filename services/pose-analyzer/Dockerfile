FROM python:3.13-slim
# MediaPipe needs EGL/GLES even on CPU; ffmpeg encodes the overlay video.
RUN apt-get update && apt-get install -y --no-install-recommends libegl1 libgles2 libgl1 ffmpeg \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python -c "from pipeline.extract import ensure_model; ensure_model()"
CMD ["python", "analyze.py", "--help"]
