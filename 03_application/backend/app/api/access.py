"""
File Purpose: access module
Inputs: Imported modules, function arguments, request payloads where applicable.
Outputs: Return values, API responses, and side effects documented in functions/classes.
Process: Implements module-specific business or UI logic.
Authorship: Louis Ferger-Andrews (@LouisFerger-Andrews)
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import FieldMap, User


def require_field_access(db: Session, field_id: str, current_user: User) -> FieldMap:
    field = db.query(FieldMap).filter(FieldMap.id == field_id).first()
    if field is None:
        raise HTTPException(status_code=404, detail='Field not found')
    if current_user.role != 'admin' and field.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail='Forbidden')
    return field
