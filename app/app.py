from pathlib import Path

from flask import Flask, render_template

from supabase_client import (
    SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_URL,
    supabase,
)


# =========================================================
# PROJECT PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# =========================================================
# FLASK APPLICATION
# =========================================================

app = Flask(
    __name__,
    template_folder=BASE_DIR / "templates",
    static_folder=BASE_DIR / "static",
)


# =========================================================
# HOME PAGE
# =========================================================

@app.route("/")
def home():

    try:

        # -------------------------------------------------
        # Get Computer Science domain
        # -------------------------------------------------

        domain_response = (
            supabase
            .table("domains")
            .select(
                "id, name, description, slug"
            )
            .eq(
                "slug",
                "computer-science"
            )
            .limit(1)
            .execute()
        )

        domain_data = domain_response.data


        if not domain_data:

            return render_template(
                "404.html"
            ), 404


        domain = domain_data[0]


        # -------------------------------------------------
        # Get areas belonging to Computer Science
        # -------------------------------------------------

        areas_response = (
            supabase
            .table("areas")
            .select(
                "id, name, description, slug"
            )
            .eq(
                "domain_id",
                domain["id"]
            )
            .order(
                "id"
            )
            .execute()
        )

        areas = areas_response.data or []


        # -------------------------------------------------
        # Render homepage
        # -------------------------------------------------

        return render_template(
            "index.html",
            domain=domain,
            areas=areas,
        )


    except Exception as error:

        print(
            "HOME PAGE ERROR:",
            repr(error)
        )

        return render_template(
            "404.html"
        ), 500


# =========================================================
# AREA PAGE
# Example:
# /area/programming
# =========================================================

@app.route("/area/<area_slug>")
def area_page(area_slug):

    try:

        # -------------------------------------------------
        # Find the area
        # -------------------------------------------------

        area_response = (
            supabase
            .table("areas")
            .select(
                "id, name, description, slug, domain_id"
            )
            .eq(
                "slug",
                area_slug
            )
            .limit(1)
            .execute()
        )

        area_data = area_response.data


        if not area_data:

            return render_template(
                "404.html"
            ), 404


        area = area_data[0]


        # -------------------------------------------------
        # Get published courses
        # -------------------------------------------------

        courses_response = (
            supabase
            .table("courses")
            .select(
                """
                id,
                title,
                description,
                slug,
                difficulty,
                estimated_minutes,
                is_published
                """
            )
            .eq(
                "area_id",
                area["id"]
            )
            .eq(
                "is_published",
                True
            )
            .order(
                "id"
            )
            .execute()
        )

        courses = courses_response.data or []


        # -------------------------------------------------
        # Render area page
        # -------------------------------------------------

        return render_template(
            "area.html",
            area=area,
            courses=courses,
        )


    except Exception as error:

        print(
            "AREA PAGE ERROR:",
            repr(error)
        )

        return render_template(
            "404.html"
        ), 500


# =========================================================
# COURSE PAGE
# Example:
# /course/python-fundamentals
# =========================================================

@app.route("/course/<course_slug>")
def course_page(course_slug):

    try:

        # -------------------------------------------------
        # Find published course
        # -------------------------------------------------

        course_response = (
            supabase
            .table("courses")
            .select(
                """
                id,
                title,
                description,
                slug,
                difficulty,
                estimated_minutes,
                is_published,
                area_id
                """
            )
            .eq(
                "slug",
                course_slug
            )
            .eq(
                "is_published",
                True
            )
            .limit(1)
            .execute()
        )

        course_data = course_response.data


        if not course_data:

            return render_template(
                "404.html"
            ), 404


        course = course_data[0]


        # -------------------------------------------------
        # Get published lessons
        # -------------------------------------------------

        lessons_response = (
            supabase
            .table("lessons")
            .select(
                """
                id,
                title,
                slug,
                lesson_order,
                estimated_minutes,
                is_published
                """
            )
            .eq(
                "course_id",
                course["id"]
            )
            .eq(
                "is_published",
                True
            )
            .order(
                "lesson_order"
            )
            .execute()
        )

        lessons = lessons_response.data or []


        # -------------------------------------------------
        # Render course page
        # -------------------------------------------------

        return render_template(
    "course.html",
    course=course,
    lessons=lessons,
    supabase_url=SUPABASE_URL,
    supabase_publishable_key=SUPABASE_PUBLISHABLE_KEY,
)


    except Exception as error:

        print(
            "COURSE PAGE ERROR:",
            repr(error)
        )

        return render_template(
            "404.html"
        ), 500


# =========================================================
# LESSON PAGE
# Example:
# /lesson/introduction-to-python
# =========================================================

@app.route("/lesson/<lesson_slug>")
def lesson_page(lesson_slug):

    try:

        # -------------------------------------------------
        # Find the published lesson
        # -------------------------------------------------

        lesson_response = (
            supabase
            .table("lessons")
            .select(
                """
                id,
                title,
                slug,
                content,
                lesson_order,
                estimated_minutes,
                is_published,
                course_id
                """
            )
            .eq(
                "slug",
                lesson_slug
            )
            .eq(
                "is_published",
                True
            )
            .limit(1)
            .execute()
        )

        lesson_data = lesson_response.data


        if not lesson_data:

            return render_template(
                "404.html"
            ), 404


        lesson = lesson_data[0]


        # -------------------------------------------------
        # Get the course
        # -------------------------------------------------

        course_response = (
            supabase
            .table("courses")
            .select(
                """
                id,
                title,
                slug,
                area_id
                """
            )
            .eq(
                "id",
                lesson["course_id"]
            )
            .limit(1)
            .execute()
        )

        course_data = course_response.data


        if not course_data:

            return render_template(
                "404.html"
            ), 404


        course = course_data[0]


        # -------------------------------------------------
        # Get all published lessons from this course
        # -------------------------------------------------

        lessons_response = (
            supabase
            .table("lessons")
            .select(
                """
                id,
                title,
                slug,
                lesson_order,
                estimated_minutes
                """
            )
            .eq(
                "course_id",
                course["id"]
            )
            .eq(
                "is_published",
                True
            )
            .order(
                "lesson_order"
            )
            .execute()
        )

        lessons = lessons_response.data or []


        # -------------------------------------------------
        # Find previous and next lessons
        # -------------------------------------------------

        previous_lesson = None
        next_lesson = None


        for index, item in enumerate(lessons):

            if item["id"] == lesson["id"]:

                if index > 0:

                    previous_lesson = lessons[
                        index - 1
                    ]


                if index < len(lessons) - 1:

                    next_lesson = lessons[
                        index + 1
                    ]

                break


        # -------------------------------------------------
        # Render lesson page
        # -------------------------------------------------

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

        print(
            "LESSON PAGE ERROR:",
            repr(error)
        )

        return render_template(
            "404.html"
        ), 500

# =========================================================
# SIGNUP
# =========================================================

@app.route("/signup")
def signup():

    return render_template(
        "signup.html",
        supabase_url=SUPABASE_URL,
        supabase_publishable_key=SUPABASE_PUBLISHABLE_KEY,
    )


# =========================================================
# LOGIN
# =========================================================

@app.route("/login")
def login():

    return render_template(
        "login.html",
        supabase_url=SUPABASE_URL,
        supabase_publishable_key=SUPABASE_PUBLISHABLE_KEY,
    )


# =========================================================
# DASHBOARD
# =========================================================

@app.route("/dashboard")
def dashboard():

    return render_template(
        "dashboard.html",
        supabase_url=SUPABASE_URL,
        supabase_publishable_key=SUPABASE_PUBLISHABLE_KEY,
    )


# =========================================================
# SUPABASE CONNECTION TEST
# =========================================================

@app.route("/supabase-test")
def supabase_test():

    try:

        supabase.auth.get_session()


        return {
            "status": "success",
            "message": "Flask is connected to Supabase.",
        }


    except Exception as error:

        return {
            "status": "error",
            "message": str(error),
        }, 500


# =========================================================
# ERROR HANDLERS
# =========================================================

@app.errorhandler(404)
def page_not_found(error):

    return render_template(
        "404.html"
    ), 404


@app.errorhandler(500)
def internal_server_error(error):

    return render_template(
        "404.html"
    ), 500


# =========================================================
# RUN DEVELOPMENT SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )