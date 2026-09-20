from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, Text, ForeignKey
from datetime import datetime, timezone
from app.core.database import Base

def default_round4_rubric():
    return [
        {"id": "logical_structure", "name": "Logical structure", "maxMarks": 20, "isConfirmed": False},
        {"id": "evidence_use", "name": "Use of evidence", "maxMarks": 20, "isConfirmed": False},
        {"id": "rebuttal", "name": "Rebuttal", "maxMarks": 20, "isConfirmed": False},
        {"id": "resource_questioning", "name": "Questioning the resource person", "maxMarks": 15, "isConfirmed": False},
        {"id": "presentation_teamwork", "name": "Presentation and teamwork", "maxMarks": 15, "isConfirmed": False},
        {"id": "time_management", "name": "Time management", "maxMarks": 10, "isConfirmed": False}
    ]

def default_final_score_formula():
    return {
        "panelScoreWeight": 1.0,
        "agentGuessingWeight": 1.0,
        "blackMarketWeightPercent": 10,
        "isFormulaConfirmed": False,
        "confirmedAt": None,
        "confirmedBy": None
    }

class Round4ConfigModel(Base):
    __tablename__ = "round4_config"

    id = Column(Integer, primary_key=True, default=1)
    rubric_categories = Column(JSON, default=default_round4_rubric, nullable=False)
    is_rubric_confirmed = Column(Boolean, default=False, nullable=False)
    judge_aggregation = Column(String(50), default="average", nullable=False)
    judges_list = Column(JSON, default=lambda: [{"id": "judge-1", "name": "Faculty Judge 1"}, {"id": "judge-2", "name": "Faculty Judge 2"}])
    is_guessing_rules_configured = Column(Boolean, default=False, nullable=False)
    guessing_points_for_correct = Column(Float, nullable=True)
    guessing_points_for_incorrect = Column(Float, nullable=True)
    final_score_formula = Column(JSON, default=default_final_score_formula, nullable=False)
    advancing_teams_count = Column(Integer, default=3, nullable=True)
    is_finalized = Column(Boolean, default=False, nullable=False)
    finalized_at = Column(DateTime, nullable=True)
    finalized_by = Column(String(100), nullable=True)

class Round4PairModel(Base):
    __tablename__ = "round4_pairs"

    id = Column(String(50), primary_key=True)  # pair-1 .. pair-4
    pair_number = Column(Integer, unique=True, nullable=False)
    team_a_id = Column(String(50), ForeignKey("teams.id"), nullable=True)
    team_b_id = Column(String(50), ForeignKey("teams.id"), nullable=True)
    is_confirmed = Column(Boolean, default=False, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
    confirmed_by = Column(String(100), nullable=True)
    case_id = Column(String(50), nullable=True)
    case_name = Column(String(200), nullable=True)
    case_details = Column(Text, nullable=True)
    team_a_side = Column(String(50), default="Unassigned", nullable=False)
    team_b_side = Column(String(50), default="Unassigned", nullable=False)
    team_a_has_case_file = Column(Boolean, default=False, nullable=False)
    team_a_has_opposing_file = Column(Boolean, default=False, nullable=False)
    team_b_has_case_file = Column(Boolean, default=False, nullable=False)
    team_b_has_opposing_file = Column(Boolean, default=False, nullable=False)
    resource_person_name = Column(String(100), nullable=True)

class Round4StageTimingModel(Base):
    __tablename__ = "round4_stages"

    id = Column(String(100), primary_key=True)  # r4-{pair_id}-{stage_id}
    pair_id = Column(String(50), ForeignKey("round4_pairs.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_id = Column(String(50), nullable=False)  # prep_1 | hearing_1 | file_exchange | prep_2 | hearing_2
    status = Column(String(50), default="not_started", nullable=False)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    actual_duration_seconds = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

class Round4JudgeScoreModel(Base):
    __tablename__ = "round4_judge_scores"

    id = Column(String(100), primary_key=True)  # js-{judge_id}-{team_id}
    judge_id = Column(String(50), nullable=False)
    judge_name = Column(String(100), nullable=False)
    team_id = Column(String(50), ForeignKey("teams.id"), nullable=False, index=True)
    scores = Column(JSON, default=dict, nullable=False)
    total_score = Column(Float, nullable=False)
    is_submitted = Column(Boolean, default=False, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    comments = Column(Text, nullable=True)

class Round4AgentGuessModel(Base):
    __tablename__ = "round4_agent_guesses"

    team_id = Column(String(50), ForeignKey("teams.id"), primary_key=True)
    outcome = Column(String(50), default="none", nullable=False)
    points_awarded = Column(Float, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

