/* =========================================================
   SKILL-BUILD
   Course enrollment / guest access flow
   ========================================================= */

"use strict";

const courseSupabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

const courseStartButton =
    document.getElementById("courseStartButton");

const courseEnrollmentMessage =
    document.getElementById("courseEnrollmentMessage");


function showCourseEnrollmentMessage(message, type = "") {
    if (!courseEnrollmentMessage) {
        return;
    }

    courseEnrollmentMessage.textContent = message;
    courseEnrollmentMessage.className =
        `course-enrollment-message ${type}`;
}


function setCourseButton(text, disabled = false) {
    if (!courseStartButton) {
        return;
    }

    courseStartButton.textContent = text;
    courseStartButton.disabled = disabled;
}


/*
   Read the current local Supabase session.
   A guest simply has no session; that is a normal state,
   not an error and should never display an enrollment error.
*/
async function getCourseSession() {
    const { data, error } =
        await courseSupabaseClient.auth.getSession();

    if (error) {
        throw error;
    }

    return data.session || null;
}


async function getCourseUser() {
    const session = await getCourseSession();
    return session ? session.user : null;
}


async function checkEnrollment(userId, courseId) {
    const { data, error } =
        await courseSupabaseClient
            .from("enrollments")
            .select("id, enrolled_at")
            .eq("user_id", userId)
            .eq("course_id", courseId)
            .limit(1);

    if (error) {
        throw error;
    }

    return data && data.length ? data[0] : null;
}


function getCurrentCoursePath() {
    return (
        window.location.pathname +
        window.location.search +
        window.location.hash
    );
}


function goToLoginForCourse() {
    const next = encodeURIComponent(getCurrentCoursePath());
    window.location.href = `/login?next=${next}`;
}


async function initialiseEnrollment() {
    if (!courseStartButton) {
        return;
    }

    const courseId = Number(courseStartButton.dataset.courseId);

    if (!courseId) {
        setCourseButton("Start Course", true);
        return;
    }

    try {
        const user = await getCourseUser();

        /*
           Guest state:
           Keep the page clean and let Start Course go directly
           to the login/signup interface when clicked.
        */
        if (!user) {
            setCourseButton("Start Course");
            showCourseEnrollmentMessage("");
            return;
        }

        const enrollment =
            await checkEnrollment(user.id, courseId);

        if (enrollment) {
            setCourseButton("Continue Course");
            showCourseEnrollmentMessage(
                "This course is already in your learning.",
                "success"
            );
            return;
        }

        setCourseButton("Start Course");
        showCourseEnrollmentMessage("");
    } catch (error) {
        /*
           Do not block a guest because the optional enrollment
           status check failed. The button can still start the
           login flow, and authenticated users can retry.
        */
        console.error("Enrollment status check error:", error);
        setCourseButton("Start Course");
        showCourseEnrollmentMessage("");
    }
}


async function startOrContinueCourse() {
    if (!courseStartButton) {
        return;
    }

    const courseId = Number(courseStartButton.dataset.courseId);

    if (!courseId) {
        return;
    }

    try {
        const user = await getCourseUser();

        /* Guest -> login/signup flow. */
        if (!user) {
            goToLoginForCourse();
            return;
        }

        setCourseButton("Starting...", true);

        const existingEnrollment =
            await checkEnrollment(user.id, courseId);

        if (!existingEnrollment) {
            const { error } =
                await courseSupabaseClient
                    .from("enrollments")
                    .insert({
                        user_id: user.id,
                        course_id: courseId
                    });

            if (error) {
                throw error;
            }
        }

        /* Enrollment is saved. Open the first lesson. */
        const firstLesson =
            document.querySelector(".lesson-card a.lesson-link");

        if (firstLesson) {
            window.location.href = firstLesson.href;
            return;
        }

        setCourseButton("Continue Course");
        showCourseEnrollmentMessage(
            "Course added to your learning.",
            "success"
        );
    } catch (error) {
        console.error("Course enrollment error:", error);
        setCourseButton("Start Course");
        showCourseEnrollmentMessage(
            "We couldn't start this course. Please try again.",
            "error"
        );
    }
}


if (courseStartButton) {
    courseStartButton.addEventListener("click", async () => {
        await startOrContinueCourse();
    });
}


initialiseEnrollment();
