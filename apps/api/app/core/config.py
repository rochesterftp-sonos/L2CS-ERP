from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://l2cs:l2cs_dev@localhost:5433/l2cs_erp"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    graph_enabled: bool = False
    graph_tenant_id: str = ""
    graph_client_id: str = ""
    graph_client_secret: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
