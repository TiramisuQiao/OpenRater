import os
from datetime import timedelta


class Settings:
    PROJECT_NAME: str = "OpenRater"
    SECRET_KEY: str = os.getenv("OPENRATER_SECRET_KEY", "supersecretkeychange")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("OPENRATER_TOKEN_MINUTES", "60"))
    DATABASE_URL: str = os.getenv("OPENRATER_DATABASE_URL", "sqlite:///./openrater.db")

    @property
    def access_token_expires(self) -> timedelta:
        return timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)


settings = Settings()
