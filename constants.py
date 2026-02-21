CATEGORIES = [
    {
        "category": "food",
        "subcategories": ["dine", "gofood", "grabfood", "snack"],
    },
    {
        "category": "groceries",
        "subcategories": [],
    },
    {
        "category": "transport",
        "subcategories": ["gojek", "grab", "flazz", "krl", "parkir"],
    },
    {
        "category": "salary",
        "subcategories": [],
    },
    {
        "category": "freelance",
        "subcategories": [],
    },
    {
        "category": "bills",
        "subcategories": ["electricity", "internet", "phone", "water"],
    },
    {
        "category": "health",
        "subcategories": ["medicine", "doctor", "gym"],
    },
    {
        "category": "entertainment",
        "subcategories": ["netflix", "spotify", "games", "cinema"],
    },
    {
        "category": "shopping",
        "subcategories": ["clothes", "electronics", "tokopedia", "shopee"],
    },
    {
        "category": "savings",
        "subcategories": [],
    },
    {
        "category": "other",
        "subcategories": [],
    },
]

# Flat list of valid category names
VALID_CATEGORIES = [c["category"] for c in CATEGORIES]

# Map category -> subcategories for quick lookup
SUBCATEGORY_MAP = {c["category"]: c["subcategories"] for c in CATEGORIES}
