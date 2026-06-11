"""
File Purpose: root health/docs endpoint
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def root() -> dict[str, str]:
    return {
        "status": "running",
        "docs": "/docs",
    }
