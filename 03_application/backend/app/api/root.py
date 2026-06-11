"""
File Purpose: root health/docs endpoint
"""

from fastapi import APIRouter
from fastapi.responses import RedirectResponse

router = APIRouter()


@router.get("/")
def root():
    return RedirectResponse(url="https://insect-detection-yellow-traps.onrender.com/docs")
