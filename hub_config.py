APP_NAME = "East Tennessee Hub"
APP_ALIAS = "myTN"

# Map friendly category keywords to canonical agent codes
INTENT_ALIASES = {
    "it": "TA", "tech": "TA", "support": "TA", "ta": "TA",
    "sales": "SA", "sa": "SA",
    "press": "PA", "media": "PA", "pa": "PA",
    "farm": "FA", "farming": "FA", "ag": "FA", "fa": "FA",
    "wildlife": "WA", "game": "WA", "wa": "WA",
    "church": "CA", "ministry": "CA", "ca": "CA",
    "job": "JA", "jobs": "JA", "career": "JA", "ja": "JA",
    "arts": "ArA", "art": "ArA", "culture": "ArA", "ara": "ArA",
    "recreation": "RA", "outdoors": "RA", "hike": "RA", "ra": "RA",
}

# Human-readable names for menus/logs
AGENT_LABELS = {
    "TA": "IT Agent",
    "SA": "Sales Agent",
    "PA": "Press Agent",
    "FA": "Farming Agent",
    "WA": "Wildlife Agent",
    "CA": "Church Agent",
    "JA": "Job Agent",
    "ArA": "Arts Agent",
    "RA": "Recreation Agent",
}
