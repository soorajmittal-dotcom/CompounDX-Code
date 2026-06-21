from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Travel Points Optimizer"
    database_url: str = "sqlite:///./travel_points.db"
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
