from functools import wraps
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

from flask import Flask, jsonify, redirect, render_template, request, session, url_for

from app.supabase_client import SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabase

BASE_DIR = Path(__file__).resolve().parent.parent

app = Flask(__name__, template_folder=BASE_DIR / "templates", static_folder=BASE_DIR / "static")
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "change-this-development-secret")


def current_user_id():
    return session.get("user_id")


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user_id():
            next_url = request.full_path.rstrip("?")
            return redirect(url_for("login", next=next_url))
        return view(*args, **kwargs)
    return wrapped


def validate_supabase_token(access_token):
    endpoint = SUPABASE_URL.rstrip("/") + "/auth/v1/user"
    req = urllib.request.Request(
        endpoint,
        method="GET",
        headers={
            "apikey": SUPABASE_PUBLISHABLE_KEY,
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, ValueError) as error:
        print("Supabase token validation failed:", repr(error))
        return None


@app.route("/")
def home():
    try:
        domain_data = (
            supabase.table("domains")
            .select("id, name, description, slug")
            .eq("slug", "computer-science")
            .limit(1).execute().data
        )
        if not domain_data:
            return render_template("404.html"), 404
        domain = domain_data[0]
        areas = (
            supabase.table("areas")
            .select("id, name, description, slug")
            .eq("domain_id", domain["id"])
            .order("id").execute().data or []
        )
        return render_template("index.html", domain=domain, areas=areas)
    except Exception as error:
        print("HOME PAGE ERROR:", repr(error))
        return render_template("404.html"), 500


@app.route("/area/<area_slug>")
def area_page(area_slug):
    try:
        area_data = (
            supabase.table("areas")
            .select("id, name, description, slug, domain_id")
            .eq("slug", area_slug)
            .limit(1).execute().data
        )
        if not area_data:
            return render_template("404.html"), 404
        area = area_data[0]
        courses = (
            supabase.table("courses")
            .select("id, title, description, slug, difficulty, estimated_minutes, is_published")
            .eq("area_id", area["id"])
            .eq("is_published", True)
            .order("id").execute().data or []
        )
        return render_template("area.html", area=area, courses=courses)
    except Exception as error:
        print("AREA PAGE ERROR:", repr(error))
        return render_template("404.html"), 500


@app.route("/course/<course_slug>")
def course_page(course_slug):
    try:
        course_data = (
            supabase.table("courses")
            .select("id, title, description, slug, difficulty, estimated_minutes, is_published, area_id")
            .eq("slug", course_slug)
            .eq("is_published", True)
            .limit(1).execute().data
        )
        if not course_data:
            return render_template("404.html"), 404
        course = course_data[0]
        lessons = (
            supabase.table("lessons")
            .select("id, title, slug, lesson_order, estimated_minutes, is_published")
            .eq("course_id", course["id"])
            .eq("is_published", True)
            .order("lesson_order").execute().data or []
        )
        return render_template(
            "course.html",
            course=course,
            lessons=lessons,
            supabase_url=SUPABASE_URL,
            supabase_publishable_key=SUPABASE_PUBLISHABLE_KEY,
        )
    except Exception as error:
        print("COURSE PAGE ERROR:", repr(error))
        return render_template("404.html"), 500


@app.route("/lesson/<lesson_slug>")
@login_required
def lesson_page(lesson_slug):
    try:
        lesson_data = (
            supabase.table("lessons")
            .select("id, title, slug, content, lesson_order, estimated_minutes, is_published, course_id")
            .eq("slug", lesson_slug)
            .eq("is_published", True)
            .limit(1).execute().data
        )
        if not lesson_data:
            return render_template("404.html"), 404
        lesson = lesson_data[0]

        course_data = (
            supabase.table("courses")
            .select("id, title, slug, area_id")
            .eq("id", lesson["course_id"])
            .limit(1).execute().data
        )
        if not course_data:
            return render_template("404.html"), 404
        course = course_data[0]

        lessons = (
            supabase.table("lessons")
            .select("id, title, slug, lesson_order, estimated_minutes")
            .eq("course_id", course["id"])
            .eq("is_published", True)
            .order("lesson_order").execute().data or []
        )

        previous_lesson = None
        next_lesson = None
        for index, item in enumerate(lessons):
            if item["id"] == lesson["id"]:
                if index > 0:
                    previous_lesson = lessons[index - 1]
                if index < len(lessons) - 1:
                    next_lesson = lessons[index + 1]
                break

        return render_template(
            "lesson.html",
            lesson=lesson,
            course=course,
            lessons=lessons,
            previous_lesson=previous_lesson,
            next_lesson=next_lesson,
            supabase_url=SUPABASE_URL,
            supabase_publishable_key=SUPABASE_PUBLISHABLE_KEY,
        )
    except Exception as error:
        print("LESSON PAGE ERROR:", repr(error))
        return render_template("404.html"), 500


@app.route("/signup")
def signup():
    return render_template("signup.html", supabase_url=SUPABASE_URL, supabase_publishable_key=SUPABASE_PUBLISHABLE_KEY)


@app.route("/login")
def login():
    return render_template("login.html", supabase_url=SUPABASE_URL, supabase_publishable_key=SUPABASE_PUBLISHABLE_KEY)


@app.route("/auth/session", methods=["POST"])
def create_auth_session():
    payload = request.get_json(silent=True) or {}
    access_token = payload.get("access_token")
    if not access_token:
        return jsonify(status="error", message="Access token is required."), 401

    user = validate_supabase_token(access_token)
    if not user or not user.get("id"):
        session.clear()
        return jsonify(status="error", message="Invalid or expired session."), 401

    session.clear()
    session["user_id"] = user["id"]
    session.permanent = True
    return jsonify(status="success", user_id=user["id"])


@app.route("/auth/session", methods=["DELETE"])
def clear_auth_session():
    session.clear()
    return jsonify(status="success")


@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html", supabase_url=SUPABASE_URL, supabase_publishable_key=SUPABASE_PUBLISHABLE_KEY)


@app.route("/supabase-test")
def supabase_test():
    try:
        supabase.auth.get_session()
        return jsonify(status="success", message="Flask is connected to Supabase.")
    except Exception as error:
        return jsonify(status="error", message=str(error)), 500


@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html"), 404


@app.errorhandler(500)
def internal_server_error(error):
    return render_template("404.html"), 500


if __name__ == "__main__":
    app.run(debug=True)
