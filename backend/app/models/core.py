from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Team(Base):
    """Core Team model owned by Person 1."""
    __tablename__ = "teams"

    id = Column(String(50), primary_key=True, index=True)
    team_number = Column(Integer, unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    status = Column(String(50), default="Registered")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    participants = relationship("Participant", back_populates="team", cascade="all, delete-orphan")

class Participant(Base):
    """Core Participant model owned by Person 1."""
    __tablename__ = "participants"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    usn = Column(String(20), unique=True, nullable=False, index=True)
    team_id = Column(String(50), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    is_leader = Column(Boolean, default=False)
    checked_in = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    team = relationship("Team", back_populates="participants")

def seed_default_teams(db):
    """Populates the 32 standard registered squads if table is empty."""
    existing_count = db.query(Team).count()
    if existing_count >= 32:
        return

    sample_squad_names = [
        "Vanguard Titans", "Cipher Syndicate", "Quantum Drift", "Nexus Protocol",
        "Aegis Vanguard", "Shadow Syndicate", "Helix Dynamics", "Apex Sentinels",
        "Binary Phantoms", "Echo Recon", "Solaris Brigade", "Chronos Enclave",
        "Ironclad Ops", "Nova Strike", "Phantom Circuit", "Zero-Day Unit",
        "Spectre Division", "Rogue Matrix", "Vortex Legion", "Omega Collective",
        "Titanium Core", "Aero Blitz", "Cyber Haven", "Pulse Rangers",
        "Delta Horizon", "Obsidian Vanguard", "Aether Sentinels", "Falcon Wing",
        "Hyperion Guild", "Starlight Armada", "Crimson Guard", "Zenith Alliance"
    ]

    for i in range(32):
        team_id = f"team-{i + 1}"
        existing = db.query(Team).filter(Team.id == team_id).first()
        if not existing:
            team_name = sample_squad_names[i] if i < len(sample_squad_names) else f"Squad {i + 1}"
            team = Team(
                id=team_id,
                team_number=i + 1,
                name=team_name,
                status="Active"
            )
            db.add(team)
    db.commit()
