from .base import BaseAgent, AgentResult

class SalesAgent(BaseAgent):
    code = "SA"
    label = "Sales Agent"

    def run(self) -> AgentResult:
        pitch = {
            "headline": "Reach more East Tennessee customers with myTN",
            "value_props": [
                "Local-first discovery",
                "Simple onboarding",
                "Action receipts for transparency",
            ],
            "cta": "Schedule a 15-minute consult",
        }
        return AgentResult(
            success=True,
            summary="Generated a lightweight sales pitch.",
            data={"pitch": pitch},
        )
