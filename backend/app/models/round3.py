from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, Text, ForeignKey
from datetime import datetime, timezone
from app.core.database import Base

def default_hidden_code_config():
    return {
        "isRequiredForQualification": False,
        "requiredFragmentCount": None,
        "isConfigured": False,
        "instructionsNote": "Official fragment requirements pending organizer confirmation."
    }

class BlackMarketConfigModel(Base):
    __tablename__ = "round3_config"

    id = Column(Integer, primary_key=True, default=1)
    starting_balance = Column(Float, default=100.0, nullable=False)
    allow_negative_balance = Column(Boolean, default=False, nullable=False)
    ranking_metric = Column(String(50), default="current_balance", nullable=False)
    scoring_direction = Column(String(50), default="higher_is_better", nullable=False)
    is_scoring_configured = Column(Boolean, default=False, nullable=False)
    hidden_code_config = Column(JSON, default=default_hidden_code_config, nullable=False)
    is_finalized = Column(Boolean, default=False, nullable=False)
    finalized_at = Column(DateTime, nullable=True)
    finalized_by = Column(String(100), nullable=True)

class BlackMarketTransactionModel(Base):
    """
    Authoritative double-entry transaction record.
    Never directly mutated or deleted. Corrections must use reversals.
    """
    __tablename__ = "round3_transactions"

    id = Column(String(100), primary_key=True, index=True)
    team_id = Column(String(50), ForeignKey("teams.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String(50), nullable=False)  # earn | spend | adjustment | reversal
    reason = Column(String(255), nullable=False)
    organizer_ref = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    is_reversed = Column(Boolean, default=False, nullable=False)
    reversal_transaction_id = Column(String(100), nullable=True)
    reversed_transaction_id = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

class BlackMarketCodeFragmentModel(Base):
    __tablename__ = "round3_code_fragments"

    id = Column(String(100), primary_key=True)
    team_id = Column(String(50), ForeignKey("teams.id"), nullable=False, index=True)
    fragment_index = Column(Integer, nullable=False)
    recovered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    recovered_by = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

class TeamCodeVerificationModel(Base):
    __tablename__ = "round3_code_verifications"

    team_id = Column(String(50), ForeignKey("teams.id"), primary_key=True)
    is_complete = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(100), nullable=True)
