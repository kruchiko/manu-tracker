import functools

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    eye_id: str
    backend_url: str = "http://localhost:3000"
    dedup_window_seconds: int = 30
    camera_index: int = 0
    frame_interval_ms: int = 500

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@functools.lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
