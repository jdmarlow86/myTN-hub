from .base import BaseAgent, AgentResult

class JobAgent(BaseAgent):
    code = "JA"
    label = "Job Agent"

    def run(self) -> AgentResult:
        steps = [
            "Draft resume bullets for most recent role",
            "Identify 3 target employers",
            "Tailor cover letter to one posting",
        ]
        return AgentResult(
            success=True,
            summary="Outlined immediate job search steps.",
            data={"steps": steps, "goal_note": self.user_goal},
        )
