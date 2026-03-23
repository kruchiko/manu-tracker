import functools

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    eye_id: str
    backend_url: str = "http://localhost:3000"
    camera_index: int = 0
    frame_interval_ms: int = 200
    presence_frames_arrive: int = Field(
        default=1,
        description="Consecutive frames with the same QR decoded before emitting arrived",
    )
    presence_frames_depart: int = Field(
        default=3,
        description="Consecutive frames without that QR before emitting departed",
    )
    presence_miss_grace: int = Field(
        default=1,
        ge=0,
        description="During arrival streak, tolerate this many missed frames (decrement instead of reset)",
    )
    opencv_arrive_frames_floor: int = Field(
        default=3,
        ge=1,
        description="When pyzbar is unavailable: minimum consecutive frames for arrived (max with presence_frames_arrive)",
    )

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@functools.lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
