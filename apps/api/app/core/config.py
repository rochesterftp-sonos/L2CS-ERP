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
    qbo_enabled: bool = False
    qbo_client_id: str = ""
    qbo_client_secret: str = ""
    qbo_redirect_uri: str = "http://localhost:8000/integrations/qbo/callback"
    qbo_environment: str = "sandbox"

    class Config:
        env_file = ".env"


settings = Settings()
