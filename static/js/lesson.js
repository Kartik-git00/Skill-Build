"use strict";

const lessonSupabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const lessonPage = document.querySelector(".lesson-page");
const completionButton = document.getElementById("markLessonCompleteButton");
const completionText = document.getElementById("lessonCompletionText");
const completionCard = document.getElementById("lessonCompletionCard");
const authMessage = document.getElementById("lessonAuthMessage");

const lessonId = lessonPage ? Number(lessonPage.dataset.lessonId) : null;
const courseId = lessonPage ? Number(lessonPage.dataset.courseId) : null;

function showMessage(text, type = "") {
    if (!authMessage) return;
    authMessage.textContent = text;
    authMessage.className = `lesson-auth-message ${type}`.trim();
}

function setCompletionState({
    buttonText,
    description,
    disabled = false,
    completed = false,
}) {
    if (completionButton) {
        completionButton.textContent = buttonText;
        completionButton.disabled = disabled;
    }

    if (completionText) {
        completionText.textContent = description;
    }

    completionCard?.classList.toggle("completed", completed);
}

async function getUser() {
    const { data, error } = await lessonSupabaseClient.auth.getUser();
    if (error) throw error;
    return data.user;
}

async function isEnrolled(userId) {
    if (!userId || !courseId) return false;

    const { data, error } = await lessonSupabaseClient
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .limit(1);

    if (error) throw error;
    return Boolean(data?.length);
}

async function getProgress(userId) {
    if (!userId || !lessonId) return null;

    const { data, error } = await lessonSupabaseClient
        .from("user_progress")
        .select("id, completed, completed_at, updated_at")
        .eq("user_id", userId)
        .eq("lesson_id", lessonId)
        .limit(1);

    if (error) throw error;
    return data?.[0] || null;
}

function showCompletedState() {
    setCompletionState({
        buttonText: "✓ Lesson Completed",
        description: "Nice work! This lesson is marked as complete.",
        disabled: true,
        completed: true,
    });
}

function showGuestState() {
    setCompletionState({
        buttonText: "Login to Track Progress",
        description: "Log in to save and track your learning progress.",
        disabled: false,
        completed: false,
    });
}

function showNotEnrolledState() {
    setCompletionState({
        buttonText: "Start Course First",
        description: "Start this course from the course page before tracking this lesson.",
        disabled: false,
        completed: false,
    });
}

async function loadProgressState() {
    if (!lessonId || !courseId || !completionButton) return;

    try {
        const user = await getUser();

        if (!user) {
            showGuestState();
            return;
        }

        const enrolled = await isEnrolled(user.id);
        if (!enrolled) {
            showNotEnrolledState();
            return;
        }

        const row = await getProgress(user.id);
        if (row?.completed) {
            showCompletedState();
            showMessage("Lesson completed.", "success");
            return;
        }

        setCompletionState({
            buttonText: "Mark as Complete",
            description: "Mark this lesson complete when you've finished learning it.",
            disabled: false,
            completed: false,
        });
        showMessage("");
    } catch (error) {
        console.error("Lesson progress load error:", error);
        setCompletionState({
            buttonText: "Mark as Complete",
            description: "Progress could not be loaded. You can try again.",
            disabled: false,
            completed: false,
        });
        showMessage("We couldn't load your lesson progress. Please try again.", "error");
    }
}

async function saveCompletion() {
    const user = await getUser();

    if (!user) {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
    }

    if (!await isEnrolled(user.id)) {
        showNotEnrolledState();
        showMessage("Start this course first to track your progress.", "error");
        return;
    }

    setCompletionState({
        buttonText: "Saving...",
        description: "Saving your lesson progress...",
        disabled: true,
        completed: false,
    });

    const existing = await getProgress(user.id);
    const now = new Date().toISOString();

    if (existing) {
        const { error } = await lessonSupabaseClient
            .from("user_progress")
            .update({
                completed: true,
                completed_at: existing.completed_at || now,
                updated_at: now,
            })
            .eq("id", existing.id)
            .eq("user_id", user.id);

        if (error) throw error;
    } else {
        const { error } = await lessonSupabaseClient
            .from("user_progress")
            .insert({
                user_id: user.id,
                lesson_id: lessonId,
                completed: true,
                completed_at: now,
                updated_at: now,
            });

        if (error) throw error;
    }

    showCompletedState();
    showMessage("Lesson completed successfully.", "success");
}

completionButton?.addEventListener("click", async () => {
    const action = completionButton.textContent.trim();

    if (action === "Login to Track Progress") {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
    }

    if (action === "Start Course First") {
        const backLink = document.querySelector('.back-link[href*="/course/"]');
        if (backLink) {
            window.location.href = backLink.href;
        }
        return;
    }

    try {
        await saveCompletion();
    } catch (error) {
        console.error("Lesson completion error:", error);
        setCompletionState({
            buttonText: "Mark as Complete",
            description: "We couldn't save your progress. Please try again.",
            disabled: false,
            completed: false,
        });
        showMessage("We couldn't save your progress. Please try again.", "error");
    }
});

loadProgressState();
