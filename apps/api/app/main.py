from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, billing, customers, tickets, ingestion, integrations, lookups, users

app = FastAPI(title="L2CS ERP", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3100"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(billing.router)
app.include_router(tickets.router)
app.include_router(ingestion.router)
app.include_router(integrations.router)
app.include_router(lookups.router)
app.include_router(users.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
