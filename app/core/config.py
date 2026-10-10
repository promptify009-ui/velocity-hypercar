from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Velocity Hypercar Configurator"
    debug: bool = True
    environment: str = "development"
    database_url: str = "sqlite:///./velocity.db"
    jwt_secret_key: str = "CHANGE_THIS_SECRET"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="after")
    def validate_production_secret(self):
        if self.environment.strip().lower() in {"prod", "production"} and (
            not self.jwt_secret_key.strip() or self.jwt_secret_key.strip() == "CHANGE_THIS_SECRET"
        ):
            raise ValueError("JWT_SECRET_KEY must be set to a non-placeholder secret in production")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
