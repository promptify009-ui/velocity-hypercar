"""Start the Velocity backend: `python run.py`
(equivalent to `uvicorn app.main:app --reload`)."""
import uvicorn

from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.debug)
