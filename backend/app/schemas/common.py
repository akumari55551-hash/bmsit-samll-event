from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional, List, Any
from datetime import datetime, timezone

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    data: T
    message: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FinalizationIssue(BaseModel):
    code: str
    message: str

class FinalizationResponse(BaseModel):
    can_finalize: bool
    issues: List[FinalizationIssue] = []
    finalized: bool = False
    advancing_team_ids: List[str] = []
    champion_team_id: Optional[str] = None
    message: Optional[str] = None

class TieReviewResponse(BaseModel):
    id: str
    round_number: int
    teams_involved: List[Any]
    ranking_metric: str
    cutoff_position: int
    tie_breaker_status: str
    review_status: str
    organizer_decision: Optional[str] = None
    advancing_team_ids: Optional[List[str]] = None
    eliminated_team_ids: Optional[List[str]] = None
    decision_timestamp: Optional[str] = None
    decided_by: Optional[str] = None
    notes: Optional[str] = None

class ResolveTieRequest(BaseModel):
    decision: str  # e.g. "MANUAL_ORDER", "SPECIAL_REMATCH"
    advancing_team_ids: List[str]
    eliminated_team_ids: List[str]
    notes: Optional[str] = None

class AuditLogResponse(BaseModel):
    id: int
    action: str
    round_number: Optional[int] = None
    entity_type: str
    entity_id: str
    actor_id: str
    actor_role: str
    details: Optional[Any] = None
    timestamp: str
