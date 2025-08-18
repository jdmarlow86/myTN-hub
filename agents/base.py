from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, Optional

@dataclass
class AgentResult:
    success: bool
    summary: str
    data: Optional[Dict[str, Any]] = None

class BaseAgent(ABC):
    code: str = "BASE"
    label: str = "Base Agent"

    def __init__(self, user_goal: str):
        self.user_goal = user_goal

    @abstractmethod
    def run(self) -> AgentResult:
        """Perform agent-specific work and return a result."""
        raise NotImplementedError
