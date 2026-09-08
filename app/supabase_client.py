import os

from dotenv import load_dotenv
from supabase import Client, create_client


load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.getenv(
    "SUPABASE_PUBLISHABLE_KEY"
)


if not SUPABASE_URL:
    raise RuntimeError(
        "SUPABASE_URL is missing from the .env file."
    )


if not SUPABASE_PUBLISHABLE_KEY:
    raise RuntimeError(
        "SUPABASE_PUBLISHABLE_KEY is missing from the .env file."
    )


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
)