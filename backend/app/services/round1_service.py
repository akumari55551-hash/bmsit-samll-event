from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.models.round1 import Round1ConfigModel, MiniRoundTimingModel
from app.models.core import Team
from app.models.progression import TieReview
from app.scoring.round1_scoring import process_round1_standings, compute_mini_round
from app.services.audit_service import log_audit_event
from app.services.progression_service import record_round_finalization
from app.services.tie_review_service import get_or_create_tie_review
from app.schemas.rounds.round1 import MiniRoundTimingInput, UpdateHintsInput

def get_or_create_round1_config(db: Session) -> Round1ConfigModel:
    cfg = db.query(Round1ConfigModel).filter(Round1ConfigModel.id == 1).first()
    if not cfg:
        cfg = Round1ConfigModel(
            id=1,
            penalty_per_hint_seconds=120,
            checkpoint_names=["Checkpoint Alpha", "Checkpoint Bravo", "Checkpoint Charlie"],
            is_finalized=False
        )
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg

def update_round1_config(db: Session, penalty_seconds: Optional[int], checkpoint_names: Optional[List[str]], actor) -> Round1ConfigModel:
    cfg = get_or_create_round1_config(db)
    if cfg.is_finalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Round 1 is finalized and cannot be reconfigured."
        )

    if penalty_seconds is not None:
        cfg.penalty_per_hint_seconds = penalty_seconds
    if checkpoint_names is not None:
        cfg.checkpoint_names = checkpoint_names

    log_audit_event(
        db=db,
        action="ROUND1_CONFIG_UPDATED",
        entity_type="Round1Config",
        entity_id="1",
        actor_id=actor.id,
        actor_role=actor.role,
        round_number=1,
        details={"penalty_per_hint_seconds": cfg.penalty_per_hint_seconds, "checkpoint_names": cfg.checkpoint_names}
    )
    db.commit()
    db.refresh(cfg)
    return cfg

def record_mini_round_timing(db: Session, team_id: str, input_data: MiniRoundTimingInput, actor) -> MiniRoundTimingModel:
    cfg = get_or_create_round1_config(db)
    if cfg.is_finalized:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round 1 is finalized. No timing edits permitted.")

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Team '{team_id}' not found.")

    timing_id = f"r1-{team_id}-{input_data.mini_round_number}"
    timing = db.query(MiniRoundTimingModel).filter(MiniRoundTimingModel.id == timing_id).first()
    if not timing:
        timing = MiniRoundTimingModel(
            id=timing_id,
            team_id=team_id,
            mini_round_number=input_data.mini_round_number
        )
        db.add(timing)

    # Process timing logic
    mr_dict = {
        "mini_round_number": input_data.mini_round_number,
        "start_time": input_data.start_time,
        "completion_time": input_data.completion_time,
        "hints_used": input_data.hints_used,
        "checkpoints": [c.model_dump() for c in (input_data.checkpoints or [])]
    }
    processed = compute_mini_round(mr_dict, cfg.penalty_per_hint_seconds)

    start_dt = datetime.fromisoformat(input_data.start_time.replace("Z", "+00:00")) if input_data.start_time else None
    comp_dt = datetime.fromisoformat(input_data.completion_time.replace("Z", "+00:00")) if input_data.completion_time else None

    timing.start_time = start_dt
    timing.completion_time = comp_dt
    timing.hints_used = processed["hints_used"]
    timing.hint_penalty_seconds = processed["hint_penalty_seconds"]
    timing.duration_seconds = processed["duration_seconds"]
    timing.adjusted_seconds = processed["adjusted_seconds"]
    timing.status = processed["status"]
    timing.checkpoints = processed["checkpoints"]

    log_audit_event(
        db=db,
        action="TIMING_RECORDED",
        entity_type="MiniRoundTiming",
        entity_id=timing_id,
        actor_id=actor.id,
        actor_role=actor.role,
        round_number=1,
        details={"duration": timing.duration_seconds, "adjusted": timing.adjusted_seconds}
    )
    db.commit()
    db.refresh(timing)
    return timing

def update_hints(db: Session, team_id: str, mini_round_number: int, hints_used: int, actor) -> MiniRoundTimingModel:
    cfg = get_or_create_round1_config(db)
    if cfg.is_finalized:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round 1 is finalized.")

    timing_id = f"r1-{team_id}-{mini_round_number}"
    timing = db.query(MiniRoundTimingModel).filter(MiniRoundTimingModel.id == timing_id).first()
    if not timing:
        timing = MiniRoundTimingModel(id=timing_id, team_id=team_id, mini_round_number=mini_round_number)
        db.add(timing)

    timing.hints_used = max(0, hints_used)
    timing.hint_penalty_seconds = timing.hints_used * cfg.penalty_per_hint_seconds
    if timing.duration_seconds is not None:
        timing.adjusted_seconds = timing.duration_seconds + timing.hint_penalty_seconds

    log_audit_event(
        db=db,
        action="HINTS_UPDATED",
        entity_type="MiniRoundTiming",
        entity_id=timing_id,
        actor_id=actor.id,
        actor_role=actor.role,
        round_number=1,
        details={"hints_used": hints_used, "penalty": timing.hint_penalty_seconds}
    )
    db.commit()
    db.refresh(timing)
    return timing

def get_round1_overview(db: Session) -> Dict[str, Any]:
    cfg = get_or_create_round1_config(db)
    teams = db.query(Team).order_by(Team.team_number.asc()).all()

    timings = db.query(MiniRoundTimingModel).all()
    timings_by_team = {}
    for t in timings:
        timings_by_team.setdefault(t.team_id, {})[t.mini_round_number] = t

    raw_records = []
    for team in teams:
        team_timings = timings_by_team.get(team.id, {})
        mini_rounds = []
        for mr_num in [1, 2, 3]:
            t = team_timings.get(mr_num)
            if t:
                mini_rounds.append({
                    "mini_round_number": mr_num,
                    "status": t.status,
                    "start_time": t.start_time.isoformat() if t.start_time else None,
                    "completion_time": t.completion_time.isoformat() if t.completion_time else None,
                    "hints_used": t.hints_used,
                    "hint_penalty_seconds": t.hint_penalty_seconds,
                    "duration_seconds": t.duration_seconds,
                    "adjusted_seconds": t.adjusted_seconds,
                    "checkpoints": t.checkpoints or []
                })
            else:
                mini_rounds.append({
                    "mini_round_number": mr_num,
                    "status": "Not Started",
                    "start_time": None,
                    "completion_time": None,
                    "hints_used": 0,
                    "hint_penalty_seconds": 0,
                    "duration_seconds": None,
                    "adjusted_seconds": None,
                    "checkpoints": []
                })

        raw_records.append({
            "team_id": team.id,
            "team_number": team.team_number,
            "team_name": team.name,
            "mini_rounds": mini_rounds
        })

    standings = process_round1_standings(raw_records, cfg.penalty_per_hint_seconds, cfg.is_finalized)

    # If tie affects cutoff, register/retrieve tie review record
    if standings.get("cutoff_boundary_tie"):
        tied_teams = [
            r for r in standings["records"]
            if r["team_id"] in standings["tied_teams_at_cutoff"]
        ]
        get_or_create_tie_review(
            db=db,
            round_number=1,
            teams_involved=tied_teams,
            ranking_metric="adjusted_total_seconds",
            cutoff_position=24,
            notes="Fastest mini-round tie breaker was identical. Cutoff straddles 24th and 25th place."
        )

    # Check if a tie review has been resolved
    tie_rev = db.query(TieReview).filter(TieReview.id == "tie-r1-cutoff24").first()
    if tie_rev and tie_rev.review_status == "RESOLVED" and standings.get("cutoff_boundary_tie"):
        # Unblock finalization if tie was resolved by organizer
        standings["can_finalize"] = len([i for i in standings["issues"] if i["code"] != "CUTOFF_TIE"]) == 0
        standings["issues"] = [i for i in standings["issues"] if i["code"] != "CUTOFF_TIE"]

    return {
        "config": {
            "penalty_per_hint_seconds": cfg.penalty_per_hint_seconds,
            "checkpoint_names": cfg.checkpoint_names or [],
            "is_finalized": cfg.is_finalized,
            "finalized_at": cfg.finalized_at.isoformat() if cfg.finalized_at else None,
            "finalized_by": cfg.finalized_by
        },
        "records": standings["records"],
        "can_finalize": standings["can_finalize"],
        "issues": standings["issues"],
        "completed_count": standings["completed_count"],
        "incomplete_count": standings["incomplete_count"],
        "top24_cutoff_time": standings["top24_cutoff_time"]
    }

def finalize_round1(db: Session, actor) -> Dict[str, Any]:
    cfg = get_or_create_round1_config(db)
    if cfg.is_finalized:
        return {
            "can_finalize": True,
            "issues": [],
            "finalized": True,
            "message": "Round 1 has already been finalized."
        }

    overview = get_round1_overview(db)
    if not overview["can_finalize"]:
        return {
            "can_finalize": False,
            "issues": overview["issues"],
            "finalized": False,
            "message": "Finalization blocked by server-side safeguards."
        }

    # Top 24 advance
    records = overview["records"]
    advancing_team_ids = [r["team_id"] for r in records if r.get("rank") and r["rank"] <= 24]

    # Handle tie review if resolved
    tie_rev = db.query(TieReview).filter(TieReview.id == "tie-r1-cutoff24").first()
    if tie_rev and tie_rev.review_status == "RESOLVED" and tie_rev.advancing_team_ids:
        # Override advancing IDs using organizer's resolution
        resolved_adv = set(tie_rev.advancing_team_ids)
        advancing_team_ids = [r["team_id"] for r in records if (r.get("rank") and r["rank"] < 24) or (r["team_id"] in resolved_adv)]

    record_round_finalization(
        db=db,
        round_number=1,
        records=records,
        advancing_team_ids=advancing_team_ids,
        finalized_by=actor.id
    )

    cfg.is_finalized = True
    cfg.finalized_at = datetime.now(timezone.utc)
    cfg.finalized_by = actor.id

    log_audit_event(
        db=db,
        action="ROUND_FINALIZED",
        entity_type="Round1Config",
        entity_id="1",
        actor_id=actor.id,
        actor_role=actor.role,
        round_number=1,
        details={"advancing_team_ids": advancing_team_ids, "advancing_count": len(advancing_team_ids)}
    )
    db.commit()

    return {
        "can_finalize": True,
        "issues": [],
        "finalized": True,
        "advancing_team_ids": advancing_team_ids,
        "message": "Round 1 successfully finalized. 24 squads advance to Round 2: Cabo."
    }

