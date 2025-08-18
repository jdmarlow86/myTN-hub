from .base import BaseAgent, AgentResult

class WildlifeAgent(BaseAgent):
    code = "WA"
    label = "Wildlife Agent"

    def run(self) -> AgentResult:
        guidance = {
            "safety": ["Keep distance", "Secure trash", "No feeding"],
            "contacts": ["TWRA hotline (local)"],
            "goal_note": self.user_goal,
        }
        return AgentResult(
            success=True,
            summary="Provided wildlife safety guidance and contacts.",
            data={"guidance": guidance},
        )
