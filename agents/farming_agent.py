from .base import BaseAgent, AgentResult

class FarmingAgent(BaseAgent):
    code = "FA"
    label = "Farming Agent"

    def run(self) -> AgentResult:
        plan = {
            "crop_rotation": ["Corn → Beans → Winter cover"],
            "soil_test": "pH & NPK baseline",
            "goal_note": self.user_goal,
        }
        return AgentResult(
            success=True,
            summary="Prepared a basic farm task plan.",
            data={"plan": plan},
        )
