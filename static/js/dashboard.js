"use strict";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let currentUser = null;
let enrolledCourses = [];
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");

function hideLoader(){ document.body.classList.remove("dashboard-loading"); const l=$("dashboardLoader"); if(l) l.style.display="none"; }
function startToday(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
function startTomorrow(){ const d=startToday(); d.setDate(d.getDate()+1); return d; }
function startWeek(){ const d=startToday(); const n=d.getDay()===0?6:d.getDay()-1; d.setDate(d.getDate()-n); return d; }
function startNextWeek(){ const d=startWeek(); d.setDate(d.getDate()+7); return d; }

async function loadDashboard(){
    try {
        const {data,error}=await supabaseClient.auth.getUser();
        if(error) throw error;
        if(!data.user){ location.replace("/login?next=/dashboard"); return; }
        currentUser=data.user;
        const name=currentUser.user_metadata?.name || currentUser.email || "Learner";
        $("userName").textContent=name;
        $("welcomeName").textContent=name;
        hideLoader();
        await loadEnrolledCourses();
        await loadQuizStats();
        await loadGoals();
        await loadActivity();
    } catch(e){ console.error(e); location.replace("/login?next=/dashboard"); }
}

async function loadEnrolledCourses(){
    const {data:enrollments,error:e1}=await supabaseClient.from("enrollments").select("course_id,enrolled_at").eq("user_id",currentUser.id).order("enrolled_at",{ascending:false});
    if(e1) throw e1;
    const ids=(enrollments||[]).map(x=>x.course_id);
    if(!ids.length){ enrolledCourses=[]; renderCourses(); return; }
    const [{data:courses,error:e2},{data:lessons,error:e3}]=await Promise.all([
        supabaseClient.from("courses").select("id,title,description,slug,difficulty,estimated_minutes,is_published").in("id",ids).eq("is_published",true),
        supabaseClient.from("lessons").select("id,course_id,title,slug,lesson_order,estimated_minutes,is_published").in("course_id",ids).eq("is_published",true).order("lesson_order")
    ]);
    if(e2) throw e2; if(e3) throw e3;
    const lessonIds=(lessons||[]).map(x=>x.id);
    let progress=[];
    if(lessonIds.length){ const {data,error}=await supabaseClient.from("user_progress").select("lesson_id,completed,completed_at").eq("user_id",currentUser.id).in("lesson_id",lessonIds); if(error) throw error; progress=data||[]; }
    const pmap=new Map(progress.map(p=>[p.lesson_id,p]));
    enrolledCourses=(courses||[]).map(c=>{ const ls=(lessons||[]).filter(l=>l.course_id===c.id); const done=ls.filter(l=>pmap.get(l.id)?.completed); const next=ls.find(l=>!pmap.get(l.id)?.completed)||ls[0]||null; return {...c,lessons:ls,done,progress:ls.length?Math.round(done.length/ls.length*100):0,next,enrolledAt:(enrollments.find(x=>x.course_id===c.id)||{}).enrolled_at}; });
    renderCourses();
}

function renderCourses(){
    const grid=$("myCourses"), empty=$("coursesEmpty"), cont=$("continueLearning"), contEmpty=$("continueEmpty");
    if(!grid) return;
    grid.innerHTML="";
    if(!enrolledCourses.length){ grid.style.display="none"; empty.hidden=false; cont.innerHTML=""; contEmpty.hidden=false; updateStats(); return; }
    grid.style.display="grid"; empty.hidden=true; contEmpty.hidden=true;
    const active=enrolledCourses.find(c=>c.progress<100&&c.next);
    if(active){ cont.innerHTML=`<article class="continue-learning-card"><div class="continue-learning-icon">▶</div><div class="continue-learning-content"><span class="section-label">CONTINUE COURSE</span><h3>${esc(active.title)}</h3><p>Next lesson: ${esc(active.next.title)}</p><div class="continue-progress-track"><div class="continue-progress-bar" style="width:${active.progress}%"></div></div><span class="continue-progress-text">${active.progress}% complete</span></div><a href="/lesson/${encodeURIComponent(active.next.slug)}" class="btn btn-primary">Continue →</a></article>`; }
    else cont.innerHTML=`<div class="continue-learning-card completed"><div class="continue-learning-icon">✓</div><div class="continue-learning-content"><span class="section-label">ALL CAUGHT UP</span><h3>Your enrolled courses are complete.</h3><p>Explore another course to keep learning.</p></div><a href="/#categories" class="btn btn-primary">Explore</a></div>`;
    enrolledCourses.forEach(c=>{ grid.insertAdjacentHTML("beforeend",`<article class="my-course-card"><div class="my-course-card-top"><span class="course-difficulty ${esc(c.difficulty||"")}">${esc(c.difficulty||"Course")}</span><span class="my-course-progress-text">${c.progress}%</span></div><h3>${esc(c.title)}</h3><p class="my-course-description">${esc(c.description||"Continue learning and build your skills.")}</p><div class="my-course-progress-track"><div class="my-course-progress-bar" style="width:${c.progress}%"></div></div><div class="my-course-card-footer"><span>${c.done.length} / ${c.lessons.length} lessons</span><a class="course-continue-link" href="${c.next?`/lesson/${encodeURIComponent(c.next.slug)}`:`/course/${encodeURIComponent(c.slug)}`} ">${c.progress>=100?"Review →":"Continue →"}</a></div></article>`); });
    updateStats();
}

function updateStats(){ const total=enrolledCourses.reduce((n,c)=>n+c.lessons.length,0); const done=enrolledCourses.reduce((n,c)=>n+c.done.length,0); if($("coursesStarted")) $("coursesStarted").textContent=enrolledCourses.length; if($("overallProgress")) $("overallProgress").textContent=(total?Math.round(done/total*100):0)+"%"; }
async function loadQuizStats(){ const {count,error}=await supabaseClient.from("quiz_attempts").select("id",{count:"exact",head:true}).eq("user_id",currentUser.id); if(!error&&$("quizzesCompleted")) $("quizzesCompleted").textContent=count||0; }
async function loadActivity(){ const {data,error}=await supabaseClient.from("user_progress").select("lesson_id,completed_at").eq("user_id",currentUser.id).eq("completed",true).order("completed_at",{ascending:false}).limit(5); if(error) return; const el=$("recentActivity"), empty=$("activityEmpty"); if(!data?.length){ el.innerHTML=""; empty.style.display="block"; return; } const ids=data.map(x=>x.lesson_id); const {data:lessons}=await supabaseClient.from("lessons").select("id,title,slug").in("id",ids); const map=new Map((lessons||[]).map(x=>[x.id,x])); el.innerHTML=data.map(x=>{const l=map.get(x.lesson_id); return l?`<a class="recent-activity-item" href="/lesson/${encodeURIComponent(l.slug)}"><span class="recent-activity-icon">✓</span><span class="recent-activity-content"><strong>${esc(l.title)}</strong><small>Lesson completed</small></span></a>`:""}).join(""); empty.style.display="none"; }

function goalMetricLabel(m){return ({lessons_completed:"lessons",quizzes_completed:"quizzes",courses_completed:"courses",study_minutes:"study minutes"})[m]||m;}
function goalPeriod(type){return type==="daily"?{from:startToday(),to:startTomorrow()}:{from:startWeek(),to:startNextWeek()};}
async function goalValue(metric,from,to){ if(metric==="lessons_completed"){const {count}=await supabaseClient.from("user_progress").select("id",{count:"exact",head:true}).eq("user_id",currentUser.id).eq("completed",true).gte("completed_at",from.toISOString()).lt("completed_at",to.toISOString());return count||0;} if(metric==="quizzes_completed"){const {count}=await supabaseClient.from("quiz_attempts").select("id",{count:"exact",head:true}).eq("user_id",currentUser.id).gte("attempted_at",from.toISOString()).lt("attempted_at",to.toISOString());return count||0;} if(metric==="courses_completed"){return enrolledCourses.filter(c=>c.progress>=100).length;} return 0; }
async function loadGoals(){ const {data,error}=await supabaseClient.from("goals").select("id,title,goal_type,metric,target_value,created_at").eq("user_id",currentUser.id).eq("is_active",true).order("created_at",{ascending:false}); if(error) return; const list=$("goalsList"), empty=$("goalsEmptyState"); list.innerHTML=""; if(!data?.length){empty.style.display="block";return;} empty.style.display="none"; for(const g of data){const p=goalPeriod(g.goal_type);const v=await goalValue(g.metric,p.from,p.to);const pct=g.target_value?Math.min(100,Math.round(v/g.target_value*100)):0; list.insertAdjacentHTML("beforeend",`<article class="goal-card"><div class="goal-card-top"><div><span class="goal-frequency">${esc(g.goal_type)}</span><h3>${esc(g.title)}</h3></div><button type="button" class="goal-delete-button" data-goal-id="${esc(g.id)}">×</button></div><div class="goal-card-metric"><strong>${v}</strong><span>/ ${g.target_value} ${esc(goalMetricLabel(g.metric))}</span></div><div class="goal-progress-track"><div class="goal-progress-bar" style="width:${pct}%"></div></div><div class="goal-card-footer"><span>${pct}% complete</span><span>${esc(g.goal_type)}</span></div></article>`); } }
function goalMsg(text,type=""){const el=$("goalMessage");if(el){el.textContent=text;el.className=`dashboard-goal-message ${type}`;}}
function formMsg(text,type="error"){const el=$("goalFormMessage");if(el){el.textContent=text;el.className=`goal-form-message ${type}`;}}
function openGoal(){const m=$("goalModal");if(m){m.classList.add("active");m.setAttribute("aria-hidden","false");document.body.classList.add("modal-open");$("goalTitle")?.focus();}}
function closeGoal(){const m=$("goalModal");if(m){m.classList.remove("active");m.setAttribute("aria-hidden","true");document.body.classList.remove("modal-open");$("goalForm")?.reset();formMsg("");}}
async function createGoal(e){e.preventDefault(); const title=$("goalTitle").value.trim(), type=$("goalType").value, metric=$("goalMetric").value,target=Number($("goalTarget").value); formMsg(""); if(title.length<2||!Number.isInteger(target)||target<1){formMsg("Enter a goal name and a valid target.");return;} if(metric==="study_minutes"){formMsg("Study-minute goals will be enabled after study-session tracking is added.");return;} $("saveGoalButton").disabled=true; try{const {error}=await supabaseClient.from("goals").insert({user_id:currentUser.id,title,goal_type:type,metric,target_value:target,start_date:new Date().toISOString().slice(0,10),is_active:true});if(error)throw error;closeGoal();goalMsg("Goal created.","success");await loadGoals();}catch(err){console.error(err);formMsg("Could not create the goal. Check Supabase RLS.");}finally{$("saveGoalButton").disabled=false;}}
async function deleteGoal(id){if(!confirm("Delete this goal?"))return;const {error}=await supabaseClient.from("goals").delete().eq("id",id).eq("user_id",currentUser.id);if(error){goalMsg("Could not delete the goal.","error");return;}await loadGoals();goalMsg("Goal deleted.","success");}

$("addGoalButton")?.addEventListener("click",openGoal); $("emptyAddGoalButton")?.addEventListener("click",openGoal); $("closeGoalModalButton")?.addEventListener("click",closeGoal); $("cancelGoalButton")?.addEventListener("click",closeGoal); $("goalModalBackdrop")?.addEventListener("click",closeGoal); $("goalForm")?.addEventListener("submit",createGoal); document.addEventListener("click",e=>{const b=e.target.closest(".goal-delete-button");if(b)deleteGoal(b.dataset.goalId);}); document.addEventListener("keydown",e=>{if(e.key==="Escape")closeGoal();}); $("logoutButton")?.addEventListener("click",async()=>{await supabaseClient.auth.signOut();await fetch("/auth/session",{method:"DELETE",credentials:"same-origin"});location.replace("/");});
loadDashboard();
