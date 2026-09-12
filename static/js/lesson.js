"use strict";


/* =========================================================
   SUPABASE
   ========================================================= */

const lessonSupabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   ELEMENTS
   ========================================================= */

const lessonPage =
    document.querySelector(
        ".lesson-page"
    );


const completionButton =
    document.getElementById(
        "markLessonCompleteButton"
    );


const completionText =
    document.getElementById(
        "lessonCompletionText"
    );


const completionCard =
    document.getElementById(
        "lessonCompletionCard"
    );


const authMessage =
    document.getElementById(
        "lessonAuthMessage"
    );


/* =========================================================
   DATA
   ========================================================= */

const lessonId =
    lessonPage
        ? Number(
            lessonPage.dataset.lessonId
        )
        : null;


/* =========================================================
   MESSAGES
   ========================================================= */

function showMessage(
    message,
    type = ""
) {

    if (!authMessage) {
        return;
    }


    authMessage.textContent =
        message;


    authMessage.className =
        `lesson-auth-message ${type}`;

}


/* =========================================================
   USER
   ========================================================= */

async function getCurrentUser() {

    const {
        data,
        error
    } =
        await lessonSupabaseClient
            .auth
            .getUser();


    if (error) {
        throw error;
    }


    return data.user;

}


/* =========================================================
   CHECK ENROLLMENT
   ========================================================= */

async function getCourseEnrollment(
    userId,
    courseId
) {

    const {
        data,
        error
    } =
        await lessonSupabaseClient
            .from("enrollments")
            .select(
                "id"
            )
            .eq(
                "user_id",
                userId
            )
            .eq(
                "course_id",
                courseId
            )
            .limit(1);


    if (error) {
        throw error;
    }


    return (
        data &&
        data.length
            ? data[0]
            : null
    );

}


/* =========================================================
   GET LESSON PROGRESS
   ========================================================= */

async function getProgress(
    userId
) {

    const {
        data,
        error
    } =
        await lessonSupabaseClient
            .from("user_progress")
            .select(
                `
                id,
                completed,
                completed_at,
                updated_at
                `
            )
            .eq(
                "user_id",
                userId
            )
            .eq(
                "lesson_id",
                lessonId
            )
            .limit(1);


    if (error) {
        throw error;
    }


    return (
        data &&
        data.length
            ? data[0]
            : null
    );

}


/* =========================================================
   COMPLETED UI
   ========================================================= */

function showCompleted() {

    if (completionButton) {

        completionButton.textContent =
            "✓ Lesson Completed";


        completionButton.disabled =
            true;

    }


    if (completionCard) {

        completionCard.classList.add(
            "completed"
        );

    }


    if (completionText) {

        completionText.textContent =
            "Nice work! This lesson is marked as complete.";

    }

}


/* =========================================================
   INCOMPLETE UI
   ========================================================= */

function showIncomplete() {

    if (completionButton) {

        completionButton.textContent =
            "Mark as Complete";


        completionButton.disabled =
            false;

    }


    if (completionCard) {

        completionCard.classList.remove(
            "completed"
        );

    }


    if (completionText) {

        completionText.textContent =
            "Mark this lesson complete when you've finished learning it.";

    }

}


/* =========================================================
   REQUIRE LOGIN
   ========================================================= */

function showLoginState() {

    if (!completionButton) {
        return;
    }


    completionButton.textContent =
        "Login to Track Progress";


    completionButton.disabled =
        false;


    if (completionText) {

        completionText.textContent =
            "Log in to save your progress and track this lesson.";

    }

}


/* =========================================================
   REQUIRE ENROLLMENT
   ========================================================= */

function showEnrollmentState() {

    if (!completionButton) {
        return;
    }


    completionButton.textContent =
        "Start Course First";


    completionButton.disabled =
        false;


    if (completionText) {

        completionText.textContent =
            "Start this course before marking lessons complete.";

    }

}


/* =========================================================
   LOAD STATE
   ========================================================= */

async function loadLessonState() {

    if (
        !lessonId ||
        !completionButton
    ) {

        return;

    }


    try {

        const user =
            await getCurrentUser();


        /*
            Guest
        */

        if (!user) {

            showLoginState();

            return;

        }


        /*
            The course ID is supplied by Flask.
            Read it from the body data attribute.
        */

        const courseId =
            Number(
                lessonPage.dataset.courseId
            );


        if (!courseId) {

            showMessage(
                "Course information is missing.",
                "error"
            );


            return;

        }


        const enrollment =
            await getCourseEnrollment(
                user.id,
                courseId
            );


        if (!enrollment) {

            showEnrollmentState();

            return;

        }


        const progress =
            await getProgress(
                user.id
            );


        if (
            progress &&
            progress.completed
        ) {

            showCompleted();

        }

        else {

            showIncomplete();

        }

    }

    catch (error) {

        console.error(
            "Lesson state error:",
            error
        );


        showMessage(
            "We couldn't load your lesson progress.",
            "error"
        );

    }

}


/* =========================================================
   MARK COMPLETE
   ========================================================= */

async function markComplete() {

    try {

        const user =
            await getCurrentUser();


        if (!user) {

            window.location.href =
                `/login?next=${encodeURIComponent(
                    window.location.pathname
                )}`;

            return;

        }


        const courseId =
            Number(
                lessonPage.dataset.courseId
            );


        if (!courseId) {

            showMessage(
                "Course information is missing.",
                "error"
            );


            return;

        }


        const enrollment =
            await getCourseEnrollment(
                user.id,
                courseId
            );


        if (!enrollment) {

            showMessage(
                "Start this course first to track your progress.",
                "error"
            );


            return;

        }


        completionButton.disabled =
            true;


        completionButton.textContent =
            "Saving...";


        const existing =
            await getProgress(
                user.id
            );


        const now =
            new Date().toISOString();


        if (existing) {

            const {
                error
            } =
                await lessonSupabaseClient
                    .from("user_progress")
                    .update(
                        {
                            completed:
                                true,

                            completed_at:
                                existing.completed_at ||
                                now,

                            updated_at:
                                now
                        }
                    )
                    .eq(
                        "id",
                        existing.id
                    )
                    .eq(
                        "user_id",
                        user.id
                    );


            if (error) {
                throw error;
            }

        }

        else {

            const {
                error
            } =
                await lessonSupabaseClient
                    .from("user_progress")
                    .insert(
                        {
                            user_id:
                                user.id,

                            lesson_id:
                                lessonId,

                            completed:
                                true,

                            completed_at:
                                now,

                            updated_at:
                                now
                        }
                    );


            if (error) {
                throw error;
            }

        }


        showCompleted();


        showMessage(
            "Lesson completed successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Lesson completion error:",
            error
        );


        completionButton.disabled =
            false;


        completionButton.textContent =
            "Mark as Complete";


        showMessage(
            "We couldn't save your progress.",
            "error"
        );

    }

}


/* =========================================================
   BUTTON
   ========================================================= */

if (completionButton) {

    completionButton.addEventListener(
        "click",
        async function () {

            const text =
                completionButton.textContent
                    .trim();


            if (
                text ===
                "Login to Track Progress"
            ) {

                window.location.href =
                    `/login?next=${encodeURIComponent(
                        window.location.pathname
                    )}`;


                return;

            }


            if (
                text ===
                "Start Course First"
            ) {

                const courseLink =
                    document.querySelector(
                        ".back-link"
                    );


                if (courseLink) {

                    window.location.href =
                        courseLink.href;

                }


                return;

            }


            await markComplete();

        }
    );

}


/* =========================================================
   START
   ========================================================= */

loadLessonState();