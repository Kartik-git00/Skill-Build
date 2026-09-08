from pathlib import Path

from flask import Flask, render_template

from supabase_client import (
    SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_URL,
    supabase
)


# ---------------------------------------------------------
# Project paths
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent


# ---------------------------------------------------------
# Flask application
# ---------------------------------------------------------

app = Flask(
    __name__,
    template_folder=BASE_DIR / "templates",
    static_folder=BASE_DIR / "static"
)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/signup")
def signup():

    return render_template(
        "signup.html",
        supabase_url=SUPABASE_URL,
        supabase_publishable_key=SUPABASE_PUBLISHABLE_KEY
    )
@app.route("/login")
def login():

    return render_template(
        "login.html",
        supabase_url=SUPABASE_URL,
        supabase_publishable_key=SUPABASE_PUBLISHABLE_KEY
    )
@app.route("/dashboard")
def dashboard():

    return render_template(
        "dashboard.html",
        supabase_url=SUPABASE_URL,
        supabase_publishable_key=SUPABASE_PUBLISHABLE_KEY
    )

@app.route("/supabase-test")
def supabase_test():

    try:

        supabase.auth.get_session()

        return {
            "status": "success",
            "message": "Flask is connected to Supabase."
        }

    except Exception as error:

        return {
            "status": "error",
            "message": str(error)
        }, 500


# ---------------------------------------------------------
# Run development server
# ---------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)