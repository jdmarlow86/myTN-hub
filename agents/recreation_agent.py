from .base import BaseAgent, AgentResult

class RecreationAgent(BaseAgent):
    code = "RA"
    label = "Recreation Agent"

    def run(self) -> AgentResult:
        itinerary = {
            "half_day": ["Greenway walk", "Picnic spot", "Scenic overlook"],
            "gear": ["Water", "Snacks", "Map"],
            "goal_note": self.user_goal,
        }
        return AgentResult(
            success=True,
            summary="Built a simple recreation itinerary.",
            data={"itinerary": itinerary},
        )
