from .base import BaseAgent, AgentResult

class ITAgent(BaseAgent):
    code = "TA"
    label = "IT Agent"

    def run(self) -> AgentResult:
        checklist = [
            "Restart device",
            "Check internet connection",
            "Run diagnostics",
            f"Goal-specific step: {self.user_goal}",
        ]
        return AgentResult(
            success=True,
            summary="Provided an IT troubleshooting checklist.",
            data={"checklist": checklist},
        )
