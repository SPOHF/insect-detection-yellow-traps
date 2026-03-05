from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import FieldMap, TrapUpload, User

router = APIRouter(prefix='/api/analytics', tags=['analytics'])


@router.get('/overview')
def analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TrapUpload, FieldMap).join(FieldMap, FieldMap.id == TrapUpload.field_id)
    if current_user.role != 'admin':
        query = query.filter(FieldMap.owner_user_id == current_user.id)

    rows = query.all()
    upload_ids = [row[0].id for row in rows]
    total_uploads = len(upload_ids)
    total_detections = sum(row[0].detection_count for row in rows)
    avg_detection = (total_detections / total_uploads) if total_uploads > 0 else 0.0

    daily_query = db.query(
        TrapUpload.capture_date.label('capture_date'),
        func.count(TrapUpload.id).label('uploads'),
        func.sum(TrapUpload.detection_count).label('detections'),
    ).join(FieldMap, FieldMap.id == TrapUpload.field_id)
    if current_user.role != 'admin':
        daily_query = daily_query.filter(FieldMap.owner_user_id == current_user.id)
    daily_rows = (
        daily_query.group_by(TrapUpload.capture_date)
        .order_by(TrapUpload.capture_date.desc())
        .limit(30)
        .all()
    )

    field_query = db.query(
        FieldMap.id.label('field_id'),
        FieldMap.name.label('field_name'),
        func.count(TrapUpload.id).label('uploads'),
        func.sum(TrapUpload.detection_count).label('detections'),
    ).join(TrapUpload, TrapUpload.field_id == FieldMap.id)
    if current_user.role != 'admin':
        field_query = field_query.filter(FieldMap.owner_user_id == current_user.id)
    field_rows = (
        field_query.group_by(FieldMap.id, FieldMap.name)
        .order_by(func.sum(TrapUpload.detection_count).desc())
        .limit(20)
        .all()
    )

    trap_query = db.query(
        TrapUpload.trap_code.label('trap_code'),
        func.count(TrapUpload.id).label('uploads'),
        func.sum(TrapUpload.detection_count).label('detections'),
    ).join(FieldMap, FieldMap.id == TrapUpload.field_id)
    if current_user.role != 'admin':
        trap_query = trap_query.filter(FieldMap.owner_user_id == current_user.id)
    trap_rows = (
        trap_query.group_by(TrapUpload.trap_code)
        .order_by(func.sum(TrapUpload.detection_count).desc())
        .limit(20)
        .all()
    )

    return {
        'scope': 'all-fields' if current_user.role == 'admin' else 'owned-fields',
        'totals': {
            'uploads': total_uploads,
            'detections': total_detections,
            'avg_detection_per_upload': round(avg_detection, 3),
        },
        'daily': [
            {
                'capture_date': str(row.capture_date),
                'uploads': int(row.uploads or 0),
                'detections': int(row.detections or 0),
            }
            for row in daily_rows
        ],
        'by_field': [
            {
                'field_id': row.field_id,
                'field_name': row.field_name,
                'uploads': int(row.uploads or 0),
                'detections': int(row.detections or 0),
            }
            for row in field_rows
        ],
        'by_trap': [
            {
                'trap_code': row.trap_code,
                'uploads': int(row.uploads or 0),
                'detections': int(row.detections or 0),
            }
            for row in trap_rows
        ],
    }
