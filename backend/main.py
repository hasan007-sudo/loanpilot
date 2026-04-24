import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes.campaigns import router as campaigns_router
from routes.leads import router as leads_router
from routes.webhook import router as webhook_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("loanpilot")

app = FastAPI(title="LoanPilot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook_router)
app.include_router(leads_router)
app.include_router(campaigns_router)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Starting LoanPilot backend")
    await init_db()


@app.get("/health")
async def health() -> dict[str, object]:
    return {"data": {"status": "ok"}, "error": None}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
