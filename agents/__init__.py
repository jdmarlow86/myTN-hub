from .it_agent import ITAgent
from .sales_agent import SalesAgent
from .press_agent import PressAgent
from .farming_agent import FarmingAgent
from .wildlife_agent import WildlifeAgent
from .church_agent import ChurchAgent
from .job_agent import JobAgent
from .arts_agent import ArtsAgent
from .recreation_agent import RecreationAgent

REGISTRY = {
    "TA": ITAgent,
    "SA": SalesAgent,
    "PA": PressAgent,
    "FA": FarmingAgent,
    "WA": WildlifeAgent,
    "CA": ChurchAgent,
    "JA": JobAgent,
    "ArA": ArtsAgent,
    "RA": RecreationAgent,
}
