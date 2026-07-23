import { createClient } from "@supabase/supabase-js";

const CURRICULUM_URL = "./assets/youth_curriculum_specification.md";
const STORAGE_KEY = "teen-fusion-taught-weeks";
const SCHEDULE_START_KEY = "teen-fusion-schedule-start";
const RESOURCES_STORAGE_KEY = "teen-fusion-resources";
const NLT_VERSION = "NLT";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const app = document.querySelector("#app");
let searchRenderTimer = null;
let pendingSearchSelection = null;

const state = {
  modules: [],
  lessons: [],
  taught: new Set(),
  selectedWeek: 1,
  activeView: "dashboard",
  query: "",
  moduleFilter: "all",
  statusFilter: "all",
  view: "grid",
  detailOpen: false,
  studentModalOpen: false,
  editingStudentId: "",
  resourceModalOpen: false,
  editingResourceId: "",
  scheduleStart: "",
  calendarCursor: "",
  students: [],
  selectedStudentId: "",
  resources: [],
  selectedResourceId: "",
  authLoading: Boolean(supabase),
  authError: "",
  studentSyncing: false,
  memberSyncing: false,
  session: null,
  user: null,
  member: null,
  members: [],
};

const icons = {
  home: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 11.2 12 4l9 7.2v8.3a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5v-8.3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4.5h9a3 3 0 0 1 3 3v12H8a3 3 0 0 0-3 3v-18Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M17 7.5h2a1 1 0 0 1 1 1v11h-3" stroke="currentColor" stroke-width="1.7"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5.5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.7"/><path d="M8 3v5M16 3v5M3 10h18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-1a3.5 3.5 0 0 0-3-3.5M16 4.3a3 3 0 0 1 0 5.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" stroke-width="1.7"/><path d="m19.3 14.3 1.1 1.9-2.2 3.8H16l-1.2-1a7.8 7.8 0 0 1-2.8.5 7.8 7.8 0 0 1-2.8-.5L8 20H5.8l-2.2-3.8 1.1-1.9a8.4 8.4 0 0 1 0-4.6L3.6 7.8 5.8 4H8l1.2 1a7.8 7.8 0 0 1 2.8-.5 7.8 7.8 0 0 1 2.8.5L16 4h2.2l2.2 3.8-1.1 1.9a8.4 8.4 0 0 1 0 4.6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m20 20-4.6-4.6M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h6v6H4V4ZM14 4h6v6h-6V4ZM4 14h6v6H4v-6ZM14 14h6v6h-6v-6Z" stroke="currentColor" stroke-width="1.7"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.3 4.3L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  light: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  question: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9.2 9a3.1 3.1 0 1 1 5.4 2.1c-.9.8-2.1 1.4-2.1 3.1" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M12 18.5h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  notes: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 4h9l3 3v13H6V4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M15 4v4h4M9 12h6M9 16h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 16.8-.8 4 4-.8L18.6 8.6 15.4 5.4 4 16.8Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m14.5 6.3 3.2 3.2M12 20h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 15v3.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V15" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 18-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

const artIcons = {
  identity: `<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M40 8 58 18v17c0 17-9 28-18 34-9-6-18-17-18-34V18L40 8Z" fill="currentColor" opacity=".18"/><path d="M40 8 58 18v17c0 17-9 28-18 34-9-6-18-17-18-34V18L40 8Z" stroke="currentColor" stroke-width="4"/><path d="M30 39h20M40 29v20" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`,
  heart: `<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M40 66S14 50 14 30c0-9 6-16 15-16 5 0 9 2 11 6 2-4 6-6 11-6 9 0 15 7 15 16 0 20-26 36-26 36Z" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="4"/></svg>`,
  phone: `<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><rect x="24" y="8" width="32" height="64" rx="7" fill="currentColor" opacity=".16" stroke="currentColor" stroke-width="4"/><path d="M33 58h14M32 22h16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  water: `<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M40 8s22 25 22 40a22 22 0 0 1-44 0C18 33 40 8 40 8Z" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="4"/><path d="M28 50c8 5 16 5 24 0" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  flame: `<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M42 70c13-5 20-15 18-28-2-13-13-18-16-31-9 8-12 15-10 24-5-3-7-8-7-14-8 8-12 17-10 28 2 12 11 19 25 21Z" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="4"/></svg>`,
  cross: `<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M34 8h12v24h20v12H46v28H34V44H14V32h20V8Z" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>`,
  crown: `<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="m14 26 14 14 12-24 12 24 14-14-6 34H20l-6-34Z" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M22 66h36" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  people: `<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><circle cx="40" cy="25" r="12" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="4"/><path d="M18 68c2-15 11-23 22-23s20 8 22 23" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M20 38c-7 2-12 9-13 19M60 38c7 2 12 9 13 19" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".75"/></svg>`,
  question: icons.question,
  path: `<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M15 68c14-8 20-18 18-30-1-8 3-17 17-24" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="m50 14 2 15 13-8" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  shield: `<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M40 8 62 18v16c0 17-9 30-22 38-13-8-22-21-22-38V18L40 8Z" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="4"/><path d="M29 42h22" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`,
};

init();

async function init() {
  const markdown = await fetch(CURRICULUM_URL).then((response) => {
    if (!response.ok) throw new Error("Curriculum file could not be loaded.");
    return response.text();
  });
  const parsed = parseCurriculum(markdown);
  state.modules = parsed.modules;
  state.lessons = parsed.lessons;
  state.taught = loadTaught();
  state.resources = loadResources();
  state.selectedResourceId = state.resources[0]?.id || "";
  state.scheduleStart = loadScheduleStart();
  state.calendarCursor = monthKey(parseLocalDate(state.scheduleStart));
  state.selectedWeek = firstUntaughtWeek() || 1;
  await initializeAuth();
  applyHashSelection();
  window.addEventListener("hashchange", () => {
    if (applyHashSelection()) render();
  });
  render();
}

function parseCurriculum(markdown) {
  const lines = markdown.split(/\r?\n/);
  const modules = [];
  const lessons = [];
  let currentModule = null;
  let currentLesson = null;
  let questionMode = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const moduleMatch = line.match(/^### Module (\d+): (.+)$/);
    if (moduleMatch) {
      currentModule = {
        number: Number(moduleMatch[1]),
        title: moduleMatch[2],
        focus: "",
        weeks: "",
        primary: "#f4a51c",
        accent: "#2f76ff",
        theme: "Teen Fusion",
        lessons: [],
      };
      modules.push(currentModule);
      questionMode = false;
      continue;
    }

    if (!currentModule) continue;

    const settingsMatch = line.match(/^\* \*\*Module Settings:\*\* Weeks (.*?) \| Primary: `([^`]+)`.*Accent: `([^`]+)`.*Theme: (.+)$/);
    if (settingsMatch) {
      currentModule.weeks = settingsMatch[1];
      currentModule.primary = settingsMatch[2];
      currentModule.accent = settingsMatch[3];
      currentModule.theme = settingsMatch[4];
      continue;
    }

    const focusMatch = line.match(/^\* \*\*Focus:\*\* (.+)$/);
    if (focusMatch) {
      currentModule.focus = focusMatch[1];
      continue;
    }

    const lessonMatch = line.match(/^#### Week (\d+): (.+)$/);
    if (lessonMatch) {
      currentLesson = {
        id: `week-${lessonMatch[1]}`,
        week: Number(lessonMatch[1]),
        title: lessonMatch[2],
        scripture: "",
        bigIdea: "",
        hook: "",
        questions: [],
        assetPrompt: "",
        tagline: "",
        moduleNumber: currentModule.number,
        moduleTitle: currentModule.title,
        moduleFocus: currentModule.focus,
        moduleTheme: currentModule.theme,
        primary: currentModule.primary,
        accent: currentModule.accent,
      };
      lessons.push(currentLesson);
      currentModule.lessons.push(currentLesson);
      questionMode = false;
      continue;
    }

    if (!currentLesson) continue;

    const fieldMatch = line.match(/^\* \*\*(Scripture|Big Idea|Hook|Asset Prompt|Tagline):\*\* (.*)$/);
    if (fieldMatch) {
      questionMode = false;
      const [, field, value] = fieldMatch;
      if (field === "Scripture") currentLesson.scripture = value;
      if (field === "Big Idea") currentLesson.bigIdea = value;
      if (field === "Hook") currentLesson.hook = value;
      if (field === "Asset Prompt") currentLesson.assetPrompt = value;
      if (field === "Tagline") currentLesson.tagline = value;
      continue;
    }

    if (line === "* **Discussion Questions:**") {
      questionMode = true;
      continue;
    }

    if (questionMode) {
      const questionMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (questionMatch) currentLesson.questions.push(questionMatch[2]);
    }
  }

  return { modules, lessons };
}

async function initializeAuth() {
  if (!supabase) {
    state.authLoading = false;
    return;
  }

  state.authLoading = true;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    state.authError = error.message;
    state.authLoading = false;
    return;
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => {
      syncAuthSession(session);
    }, 0);
  });

  await syncAuthSession(data.session, { silent: true });
  state.authLoading = false;
}

async function syncAuthSession(session, options = {}) {
  state.session = session;
  state.user = session?.user || null;
  state.authError = "";

  if (!state.user) {
    state.member = null;
    state.members = [];
    state.students = [];
    state.selectedStudentId = "";
    if (!options.silent) render();
    return;
  }

  await loadCurrentMember();
  if (isApprovedMember()) {
    await loadStudentsFromSupabase();
    if (isApprovedAdmin()) await loadMembersFromSupabase();
  } else {
    state.students = [];
    state.selectedStudentId = "";
  }

  if (!options.silent) render();
}

async function loadCurrentMember() {
  state.memberSyncing = true;
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", state.user.id)
    .maybeSingle();

  if (error) {
    state.authError = error.message;
    state.memberSyncing = false;
    return;
  }

  if (data) {
    state.member = normalizeMember(data);
    state.memberSyncing = false;
    return;
  }

  const profile = {
    user_id: state.user.id,
    full_name: userDisplayName(state.user),
    email: state.user.email || "",
  };
  const { data: inserted, error: insertError } = await supabase
    .from("members")
    .insert(profile)
    .select()
    .single();

  if (insertError) state.authError = insertError.message;
  state.member = inserted ? normalizeMember(inserted) : null;
  state.memberSyncing = false;
}

async function loadMembersFromSupabase() {
  if (!isApprovedAdmin()) return;
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("status", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    state.authError = error.message;
    return;
  }

  state.members = (data || []).map(normalizeMember);
}

async function loadStudentsFromSupabase() {
  state.studentSyncing = true;
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    state.authError = error.message;
    state.studentSyncing = false;
    return;
  }

  state.students = (data || []).map(normalizeStudent);
  state.selectedStudentId = state.students.some((student) => student.id === state.selectedStudentId)
    ? state.selectedStudentId
    : state.students[0]?.id || "";
  state.studentSyncing = false;
}

async function saveStudentToSupabase(student) {
  if (!isApprovedMember()) throw new Error("Your account is not approved to edit the roster yet.");
  const payload = studentToRow(student);

  if (state.editingStudentId) {
    const { data, error } = await supabase
      .from("students")
      .update(payload)
      .eq("id", state.editingStudentId)
      .select()
      .single();
    if (error) throw error;
    const saved = normalizeStudent(data);
    state.students = state.students.map((entry) => (entry.id === saved.id ? saved : entry));
    state.selectedStudentId = saved.id;
    return;
  }

  const { data, error } = await supabase
    .from("students")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  const saved = normalizeStudent(data);
  state.students = [saved, ...state.students];
  state.selectedStudentId = saved.id;
}

async function deleteStudentFromSupabase(studentId) {
  if (!isApprovedMember()) throw new Error("Your account is not approved to edit the roster yet.");
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) throw error;
  state.students = state.students.filter((entry) => entry.id !== studentId);
  state.selectedStudentId = state.students[0]?.id || "";
}

async function updateMemberAccess(userId, changes) {
  if (!isApprovedAdmin()) throw new Error("Only approved admins can update leader access.");
  const { data, error } = await supabase
    .from("members")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  const updated = normalizeMember(data);
  state.members = state.members.map((member) => (member.userId === updated.userId ? updated : member));
  if (state.user?.id === updated.userId) state.member = updated;
}

async function signInWithGoogle() {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    },
  });
  if (error) {
    state.authError = error.message;
    render();
  }
}

async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
  await syncAuthSession(null);
}

function shouldShowAuthGate() {
  if (!supabase) return true;
  if (state.authLoading) return true;
  if (!state.user) return true;
  if (!isApprovedMember()) return true;
  return false;
}

function isApprovedMember() {
  return state.member?.status === "approved" && ["admin", "leader"].includes(state.member?.role);
}

function isApprovedAdmin() {
  return state.member?.status === "approved" && state.member?.role === "admin";
}

function normalizeStudent(row) {
  return {
    id: String(row.id),
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    address: row.address || "",
    phone: row.phone || "",
    emergencyName: row.emergency_contact_name || "",
    emergencyPhone: row.emergency_contact_phone || "",
    notes: row.pertinent_info || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function studentToRow(student) {
  return {
    first_name: student.firstName,
    last_name: student.lastName,
    address: student.address || null,
    phone: student.phone || null,
    emergency_contact_name: student.emergencyName || null,
    emergency_contact_phone: student.emergencyPhone || null,
    pertinent_info: student.notes || null,
  };
}

function normalizeMember(row) {
  return {
    userId: row.user_id,
    fullName: row.full_name || "",
    email: row.email || "",
    phone: row.phone || "",
    role: row.role || "leader",
    status: row.status || "pending",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function userDisplayName(user = state.user) {
  return user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email
    || "Youth Leader";
}

function accountInitials() {
  const source = userDisplayName();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase() || "TF";
}

function render() {
  if (shouldShowAuthGate()) {
    app.innerHTML = renderAuthGate();
    bindAuthEvents();
    return;
  }

  const selected = getSelectedLesson();
  const taughtCount = state.taught.size;
  const progress = Math.round((taughtCount / state.lessons.length) * 100);
  const upcoming = state.lessons.length - taughtCount;

  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar(taughtCount, upcoming, progress)}
      <main class="main">
        ${renderActivePage()}
      </main>
      ${renderSideDetail(selected)}
    </div>
  `;

  bindEvents();
  restoreSearchFocus();
}

function renderActivePage() {
  if (state.activeView === "calendar") return renderCalendarPage();
  if (state.activeView === "group") return renderGroupPage();
  if (state.activeView === "resources") return renderResourcesPage();
  if (state.activeView === "settings") return renderSettingsPage();
  return renderDashboardPage();
}

function renderSideDetail(selectedLesson) {
  if (state.activeView === "group") return renderStudentDetail();
  if (state.activeView === "resources") return renderResourceDetail();
  if (state.activeView === "settings") return renderAccountDetail();
  return renderDetail(selectedLesson);
}

function renderAuthGate() {
  let eyebrow = "Secure Roster";
  let title = "Sign in to Teen Fusion";
  let message = "Use your approved Google account to access the shared youth leader dashboard and student roster.";
  let actions = `<button class="primary-button" data-action="sign-in-google">${icons.users} Continue with Google</button>`;

  if (!supabase) {
    eyebrow = "Setup Needed";
    title = "Supabase is not configured yet";
    message = "Add the public Supabase URL and anon key to Vercel, then pull them into local development when you want to test on this Mac.";
    actions = `
      <div class="env-list">
        <code>VITE_SUPABASE_URL</code>
        <code>VITE_SUPABASE_ANON_KEY</code>
      </div>
    `;
  } else if (state.authLoading) {
    eyebrow = "Loading";
    title = "Checking your access";
    message = "One moment while Teen Fusion verifies your sign-in and roster permissions.";
    actions = `<div class="sync-pill">Checking access...</div>`;
  } else if (state.user && state.member?.status === "pending") {
    eyebrow = "Approval Needed";
    title = "Your leader request is waiting";
    message = "Your Google sign-in worked. A church admin needs to approve this account before student roster details are available.";
    actions = `
      <div class="account-summary">
        <strong>${escapeHtml(userDisplayName())}</strong>
        <span>${escapeHtml(state.user.email || "")}</span>
      </div>
      <button class="ghost-button" data-action="sign-out">Sign out</button>
    `;
  } else if (state.user && state.member?.status === "disabled") {
    eyebrow = "Access Disabled";
    title = "This account cannot access the roster";
    message = "A church admin has disabled this leader account. Sign out to use a different approved Google account.";
    actions = `<button class="ghost-button" data-action="sign-out">Sign out</button>`;
  }

  return `
    <main class="auth-shell">
      <section class="auth-card">
        <img src="./assets/teen-fusion-logo.png" alt="Teen Fusion" />
        <span class="section-label">${eyebrow}</span>
        <h1>${title}</h1>
        <p>${message}</p>
        ${state.authError ? `<p class="form-error">${escapeHtml(state.authError)}</p>` : ""}
        <div class="auth-actions">${actions}</div>
      </section>
    </main>
  `;
}

function renderDashboardPage() {
  const selected = getSelectedLesson();
  const filtered = filteredLessons();
  return `
    ${renderTopbar()}
    ${renderFeatured(selected)}
    <section>
      <div class="content-head">
        <h2>${filtered.length} Lessons</h2>
        <div class="view-switch" aria-label="View mode">
          <button class="icon-button ${state.view === "grid" ? "active" : ""}" data-action="set-view" data-view="grid" aria-label="Grid view">${icons.grid}</button>
          <button class="icon-button ${state.view === "compact" ? "active" : ""}" data-action="set-view" data-view="compact" aria-label="Compact view">${icons.list}</button>
        </div>
      </div>
      <div class="lesson-grid ${state.view === "compact" ? "compact" : ""}">
        ${filtered.length ? filtered.map(renderLessonCard).join("") : renderEmptyState()}
      </div>
    </section>
  `;
}

function renderCalendarPage() {
  const cursor = parseMonthKey(state.calendarCursor);
  const scheduledLessons = lessonsWithDates();
  const monthLessons = scheduledLessons.filter(({ date }) => monthKey(date) === state.calendarCursor);
  const nextLessons = scheduledLessons
    .filter(({ date }) => date >= startOfToday())
    .slice(0, 6);

  return `
    <header class="topbar calendar-topbar">
      <div class="title-stack">
        <h1>Content Calendar</h1>
        <p>Plan the 52-week track by date. Sundays hold the main lesson, and Wednesdays can carry that same discussion into the larger group.</p>
      </div>
      <div class="toolbar">
        <label class="date-shell">
          <span>Week 1 starts</span>
          <input id="schedule-start" type="date" value="${state.scheduleStart}" />
        </label>
        <button class="ghost-button" data-action="jump-selected-week">${icons.notes} Selected Lesson</button>
      </div>
    </header>

    <section class="calendar-layout">
      <div class="calendar-board">
        <div class="calendar-heading">
          <button class="icon-button" data-action="shift-month" data-shift="-1" aria-label="Previous month">${icons.chevronLeft}</button>
          <div>
            <span class="section-label">Curriculum Schedule</span>
            <h2>${monthTitle(cursor)}</h2>
          </div>
          <button class="icon-button" data-action="shift-month" data-shift="1" aria-label="Next month">${icons.chevronRight}</button>
        </div>
        <div class="calendar-weekdays">
          ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span>${day}</span>`).join("")}
        </div>
        <div class="calendar-grid">
          ${renderCalendarCells(cursor, scheduledLessons)}
        </div>
      </div>

      <aside class="calendar-side">
        <section class="calendar-side-section">
          <div class="side-heading">
            <span class="section-label">This Month</span>
            <strong>${monthLessons.length} Events</strong>
          </div>
          <div class="mini-lesson-list">
            ${monthLessons.length ? monthLessons.map(renderCalendarListItem).join("") : `<p class="muted-copy">No curriculum events are scheduled in this month.</p>`}
          </div>
        </section>
        <section class="calendar-side-section">
          <div class="side-heading">
            <span class="section-label">Coming Up</span>
            <strong>${nextLessons.length} Next</strong>
          </div>
          <div class="mini-lesson-list">
            ${nextLessons.map(renderCalendarListItem).join("")}
          </div>
        </section>
      </aside>
    </section>
  `;
}

function renderCalendarCells(cursor, scheduledLessons) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index);
    const inMonth = date.getMonth() === month;
    const dayLessons = scheduledLessons.filter((item) => isSameDate(item.date, date));
    const isToday = isSameDate(date, startOfToday());
    const primaryLesson = dayLessons[0]?.lesson;
    return `
      <div class="calendar-cell ${inMonth ? "" : "muted"} ${isToday ? "today" : ""} ${primaryLesson ? "has-lesson" : ""}" ${primaryLesson ? `data-action="open-calendar-lesson" data-week="${primaryLesson.week}" role="button" tabindex="0"` : ""}>
        <div class="date-number">${date.getDate()}</div>
        <div class="calendar-events">
          ${dayLessons.map(renderCalendarEvent).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function renderCalendarEvent({ lesson, date, type }) {
  const taught = state.taught.has(lesson.week);
  const isCarryover = type === "carryover";
  return `
    <a class="calendar-event ${isCarryover ? "carryover" : ""} ${taught ? "taught" : ""}" href="#week-${lesson.week}" data-action="open-calendar-lesson" data-week="${lesson.week}" style="--primary: ${lesson.primary}; --accent: ${lesson.accent}">
      <span>${isCarryover ? "Wed Carryover" : `Week ${lesson.week}`}</span>
      <strong>${escapeHtml(lesson.title)}</strong>
      <small>${formatShortDate(date)}</small>
    </a>
  `;
}

function renderCalendarListItem({ lesson, date, type }) {
  const isCarryover = type === "carryover";
  return `
    <a class="mini-lesson ${isCarryover ? "carryover" : ""}" href="#week-${lesson.week}" data-action="open-calendar-lesson" data-week="${lesson.week}" style="--primary: ${lesson.primary}">
      <i class="module-swatch"></i>
      <span>
        <strong>${escapeHtml(lesson.title)}</strong>
        <small>${isCarryover ? `Week ${lesson.week} Carryover` : `Week ${lesson.week}`} · ${formatLongDate(date)}</small>
      </span>
    </a>
  `;
}

function renderGroupPage() {
  const students = [...state.students].sort((a, b) => studentName(a).localeCompare(studentName(b)));
  return `
    <header class="topbar group-topbar">
      <div class="title-stack">
        <h1>My Group</h1>
        <p>Use the roster cards to quickly pull up emergency contacts, allergies, medical notes, and other important details.</p>
      </div>
      <div class="group-actions">
        <div class="group-count">
          <strong>${students.length}</strong>
          <span>${students.length === 1 ? "Student" : "Students"}</span>
        </div>
        <button class="primary-button" data-action="open-student-modal">${icons.users} Add Student</button>
      </div>
    </header>

    <section class="group-layout">
      <section class="student-roster">
        <div class="content-head">
          <h2>Student Cards</h2>
          <span class="muted-copy">Click a card for full details</span>
        </div>
        <div class="student-grid">
          ${students.length ? students.map(renderStudentCard).join("") : renderStudentEmptyState()}
        </div>
      </section>
    </section>
    ${renderStudentModal()}
  `;
}

function renderStudentModal() {
  if (!state.studentModalOpen) return "";

  const student = editingStudent();
  const isEditing = Boolean(student);

  return `
    <div class="modal-backdrop" data-action="close-student-modal">
      <section class="student-modal" role="dialog" aria-modal="true" aria-labelledby="student-modal-title">
        <button class="detail-close modal-close" data-action="close-student-modal" aria-label="Close student form">${icons.x}</button>
        <form class="student-form" id="student-form">
          <div class="form-heading">
            <span class="section-label">${isEditing ? "Student Update" : "Student Entry"}</span>
            <h2 id="student-modal-title">${isEditing ? "Edit Student" : "Add Student"}</h2>
          </div>
          <div class="form-grid">
            ${formField("firstName", "First Name", "text", "Jordan", true, student?.firstName || "")}
            ${formField("lastName", "Last Name", "text", "Taylor", true, student?.lastName || "")}
            ${formField("phone", "Student Phone", "tel", "(555) 123-4567", false, student?.phone || "")}
            ${formField("emergencyName", "Emergency Contact", "text", "Parent or guardian", true, student?.emergencyName || "")}
            ${formField("emergencyPhone", "Emergency Phone", "tel", "(555) 987-6543", true, student?.emergencyPhone || "")}
            <label class="field field-wide">
              <span>Address</span>
              <textarea name="address" rows="3" placeholder="Street, city, state, ZIP">${escapeHtml(student?.address || "")}</textarea>
            </label>
            <label class="field field-wide">
              <span>Student History & Pertinent Information</span>
              <textarea name="notes" rows="4" placeholder="Medical conditions, allergies, pickup notes, student history, or pastoral care context">${escapeHtml(student?.notes || "")}</textarea>
            </label>
          </div>
          <button class="primary-button" type="submit">${icons.check} ${isEditing ? "Save Changes" : "Save Student"}</button>
        </form>
      </section>
    </div>
  `;
}

function formField(name, label, type, placeholder, required = false, value = "") {
  return `
    <label class="field">
      <span>${label}</span>
      <input name="${name}" type="${type}" placeholder="${placeholder}" value="${escapeHtml(value)}" ${required ? "required" : ""} />
    </label>
  `;
}

function renderStudentCard(student) {
  const active = student.id === state.selectedStudentId;
  return `
    <article class="student-card ${active ? "active" : ""}" data-action="select-student" data-student-id="${student.id}" role="button" tabindex="0">
      <div class="student-avatar">${studentInitials(student)}</div>
      <div class="student-card-copy">
        <strong>${escapeHtml(studentName(student))}</strong>
        <span>${escapeHtml(student.phone || "No student phone listed")}</span>
        <small>${escapeHtml(student.emergencyName || "Emergency contact needed")}</small>
      </div>
    </article>
  `;
}

function renderStudentEmptyState() {
  return `
    <div class="empty-state">
      <div>
        <strong>No students yet.</strong>
        <p class="muted-copy">Use Add Student to build this shared group roster.</p>
      </div>
    </div>
  `;
}

function renderStudentDetail() {
  const student = selectedStudent();
  if (!student) {
    return `
      <aside class="detail-panel student-detail-panel" aria-label="Student details">
        <button class="detail-close" data-action="close-detail" aria-label="Close details">${icons.x}</button>
        <div class="student-detail-empty">
          <div class="student-avatar large">TF</div>
          <h2>No Student Selected</h2>
          <p>Add a student or select a roster card to view full contact and care details.</p>
        </div>
      </aside>
    `;
  }

  return `
    <aside class="detail-panel student-detail-panel ${state.detailOpen ? "open" : ""}" aria-label="Student details">
      <button class="detail-close" data-action="close-detail" aria-label="Close details">${icons.x}</button>
      <div class="student-detail-header">
        <div class="student-avatar large">${studentInitials(student)}</div>
        <span class="section-label">Student Profile</span>
        <h2>${escapeHtml(studentName(student))}</h2>
      </div>
      ${studentDetailSection("Phone", student.phone || "No student phone listed.")}
      ${studentDetailSection("Address", student.address || "No address listed.")}
      ${studentDetailSection("Emergency Contact", student.emergencyName || "No emergency contact listed.")}
      ${studentDetailSection("Emergency Phone", student.emergencyPhone || "No emergency phone listed.")}
      ${studentDetailSection("Student History & Pertinent Information", student.notes || "No medical conditions, allergies, student history, or other notes listed.")}
      ${studentDetailSection(student.updatedAt ? "Updated" : "Saved", formatResourceDate(student.updatedAt || student.createdAt))}
      <div class="detail-actions">
        <button class="ghost-button" data-action="edit-student" data-student-id="${student.id}">${icons.edit} Edit Student</button>
        <button class="ghost-button danger-action" data-action="delete-student" data-student-id="${student.id}">Remove Student</button>
      </div>
    </aside>
  `;
}

function studentDetailSection(label, value) {
  return `
    <section class="detail-section student-detail-section">
      <h3>${label}</h3>
      <p>${escapeHtml(value)}</p>
    </section>
  `;
}

function renderResourcesPage() {
  const resources = [...state.resources].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return `
    <header class="topbar group-topbar">
      <div class="title-stack">
        <h1>Resources</h1>
        <p>Keep teaching notes, helpful links, activity ideas, and follow-up material in one place for quick access during the week.</p>
      </div>
      <div class="group-actions">
        <div class="group-count">
          <strong>${resources.length}</strong>
          <span>${resources.length === 1 ? "Resource" : "Resources"}</span>
        </div>
        <button class="primary-button" data-action="open-resource-modal">${icons.folder} Add Resource</button>
      </div>
    </header>

    <section class="resource-layout">
      <section class="resource-roster">
        <div class="content-head">
          <h2>Saved Resources</h2>
          <span class="muted-copy">Click a card for notes, links, and related lesson details</span>
        </div>
        <div class="resource-grid">
          ${resources.length ? resources.map(renderResourceCard).join("") : renderResourceEmptyState()}
        </div>
      </section>
    </section>
    ${renderResourceModal()}
  `;
}

function renderResourceModal() {
  if (!state.resourceModalOpen) return "";
  const resource = editingResource();
  const isEditing = Boolean(resource);
  const type = resource?.type || "Note";
  const week = resource?.week ? String(resource.week) : "";

  return `
    <div class="modal-backdrop" data-action="close-resource-modal">
      <section class="student-modal" role="dialog" aria-modal="true" aria-labelledby="resource-modal-title">
        <button class="detail-close modal-close" data-action="close-resource-modal" aria-label="Close resource form">${icons.x}</button>
        <form class="student-form resource-form" id="resource-form">
          <div class="form-heading">
            <span class="section-label">Resource Entry</span>
            <h2 id="resource-modal-title">${isEditing ? "Edit Resource" : "Add Resource"}</h2>
          </div>
          <div class="form-grid">
            ${formField("title", "Title", "text", "Small group discussion guide", true, resource?.title || "")}
            <label class="field">
              <span>Type</span>
              <select name="type">
                ${["Note", "Link", "Activity", "Prayer", "Follow-up"].map((option) => `<option value="${option}" ${type === option ? "selected" : ""}>${option}</option>`).join("")}
              </select>
            </label>
            ${formField("url", "Link", "text", "example.com/resource", false, resource?.url || "")}
            <label class="field">
              <span>Related Lesson</span>
              <select name="week">
                <option value="" ${week ? "" : "selected"}>No specific lesson</option>
                ${state.lessons.map((lesson) => `<option value="${lesson.week}" ${week === String(lesson.week) ? "selected" : ""}>Week ${lesson.week}: ${escapeHtml(lesson.title)}</option>`).join("")}
              </select>
            </label>
            ${formField("tags", "Tags", "text", "parent follow-up, game, prayer", false, resource?.tags || "")}
            <label class="field field-wide">
              <span>Notes</span>
              <textarea name="notes" rows="5" placeholder="Paste notes, discussion ideas, reminders, supply lists, or leader context here">${escapeHtml(resource?.notes || "")}</textarea>
            </label>
          </div>
          <button class="primary-button" type="submit">${icons.check} ${isEditing ? "Save Changes" : "Save Resource"}</button>
        </form>
      </section>
    </div>
  `;
}

function renderResourceCard(resource) {
  const active = resource.id === state.selectedResourceId;
  const relatedLesson = lessonForResource(resource);
  return `
    <article class="resource-card ${active ? "active" : ""}" data-action="select-resource" data-resource-id="${resource.id}" role="button" tabindex="0">
      <div class="resource-type">${escapeHtml(resource.type || "Note")}</div>
      <div class="resource-card-copy">
        <strong>${escapeHtml(resource.title || "Untitled Resource")}</strong>
        <span>${escapeHtml(resource.url ? resourceHost(resource.url) : resource.notes || "No notes added yet.")}</span>
        <small>${relatedLesson ? `Week ${relatedLesson.week} · ${escapeHtml(relatedLesson.title)}` : escapeHtml(resource.tags || "General resource")}</small>
      </div>
    </article>
  `;
}

function renderResourceEmptyState() {
  return `
    <div class="empty-state">
      <div>
        <strong>No resources yet.</strong>
        <p class="muted-copy">Use Add Resource to save notes, links, activity ideas, or follow-up material.</p>
      </div>
    </div>
  `;
}

function renderResourceDetail() {
  const resource = selectedResource();
  if (!resource) {
    return `
      <aside class="detail-panel resource-detail-panel" aria-label="Resource details">
        <button class="detail-close" data-action="close-detail" aria-label="Close details">${icons.x}</button>
        <div class="student-detail-empty">
          <div class="resource-mark large">${icons.folder}</div>
          <h2>No Resource Selected</h2>
          <p>Add a resource or select a saved card to view notes, links, and related lesson context.</p>
        </div>
      </aside>
    `;
  }

  const relatedLesson = lessonForResource(resource);
  return `
    <aside class="detail-panel resource-detail-panel ${state.detailOpen ? "open" : ""}" aria-label="Resource details">
      <button class="detail-close" data-action="close-detail" aria-label="Close details">${icons.x}</button>
      <div class="student-detail-header">
        <div class="resource-mark large">${icons.folder}</div>
        <span class="section-label">${escapeHtml(resource.type || "Resource")}</span>
        <h2>${escapeHtml(resource.title || "Untitled Resource")}</h2>
        ${resource.tags ? `<span class="tagline">${escapeHtml(resource.tags)}</span>` : ""}
      </div>
      ${resource.url ? `
        <div class="detail-actions resource-link-actions">
          <a class="primary-button resource-link-button" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">${icons.folder} Open Link</a>
        </div>
      ` : ""}
      ${resourceDetailSection("Notes", resource.notes || "No notes listed.")}
      ${resourceDetailSection("Related Lesson", relatedLesson ? `Week ${relatedLesson.week}: ${relatedLesson.title}` : "No specific lesson selected.")}
      ${resourceDetailSection(resource.updatedAt ? "Updated" : "Saved", formatResourceDate(resource.updatedAt || resource.createdAt))}
      <div class="detail-actions">
        <button class="ghost-button" data-action="edit-resource" data-resource-id="${resource.id}">Edit Resource</button>
        ${relatedLesson ? `<button class="ghost-button" data-action="open-resource-lesson" data-week="${relatedLesson.week}">Open Related Lesson</button>` : ""}
        <button class="ghost-button danger-action" data-action="delete-resource" data-resource-id="${resource.id}">Remove Resource</button>
      </div>
    </aside>
  `;
}

function resourceDetailSection(label, value) {
  return `
    <section class="detail-section resource-detail-section">
      <h3>${label}</h3>
      <p>${escapeHtml(value)}</p>
    </section>
  `;
}

function renderSettingsPage() {
  const pendingMembers = state.members.filter((member) => member.status === "pending");
  const approvedMembers = state.members.filter((member) => member.status === "approved");
  const disabledMembers = state.members.filter((member) => member.status === "disabled");
  return `
    <header class="topbar group-topbar">
      <div class="title-stack">
        <h1>Settings</h1>
        <p>Manage leader access, account status, and the secure shared roster connection.</p>
      </div>
      <div class="group-actions">
        <button class="ghost-button" data-action="refresh-remote-data">${icons.check} Refresh</button>
        <button class="ghost-button" data-action="sign-out">Sign out</button>
      </div>
    </header>

    <section class="settings-layout">
      <article class="settings-card">
        <span class="section-label">Signed In</span>
        <h2>${escapeHtml(userDisplayName())}</h2>
        <p>${escapeHtml(state.user?.email || "No email listed")}</p>
        <div class="member-badges">
          <span>${escapeHtml(state.member?.role || "leader")}</span>
          <span>${escapeHtml(state.member?.status || "pending")}</span>
        </div>
      </article>

      <article class="settings-card">
        <span class="section-label">Roster Storage</span>
        <h2>Supabase Connected</h2>
        <p>Student cards are stored in the shared Supabase roster, so approved leaders can see the same student data from desktop and mobile.</p>
        ${state.studentSyncing ? `<div class="sync-pill">Syncing roster...</div>` : ""}
      </article>

      ${isApprovedAdmin() ? `
        <section class="settings-card settings-card-wide">
          <div class="content-head">
            <div>
              <span class="section-label">Admin Access</span>
              <h2>Leader Approvals</h2>
            </div>
            <span class="muted-copy">${state.members.length} total accounts</span>
          </div>
          ${renderMemberSection("Pending Requests", pendingMembers)}
          ${renderMemberSection("Approved Leaders", approvedMembers)}
          ${renderMemberSection("Disabled Accounts", disabledMembers)}
        </section>
      ` : `
        <article class="settings-card settings-card-wide">
          <span class="section-label">Leader Access</span>
          <h2>Approved Leader</h2>
          <p>You can view and update the shared roster. Admin approval controls are only shown to admin accounts.</p>
        </article>
      `}
    </section>
  `;
}

function renderMemberSection(title, members) {
  return `
    <section class="member-section">
      <div class="member-section-head">
        <h3>${title}</h3>
        <span>${members.length}</span>
      </div>
      <div class="member-list">
        ${members.length ? members.map(renderMemberRow).join("") : `<p class="muted-copy">Nothing here right now.</p>`}
      </div>
    </section>
  `;
}

function renderMemberRow(member) {
  const isSelf = member.userId === state.user?.id;
  return `
    <article class="member-row">
      <div class="member-identity">
        <strong>${escapeHtml(member.fullName || member.email || "Unnamed Leader")}</strong>
        <span>${escapeHtml(member.email || "No email listed")}</span>
        <small>${escapeHtml(member.role)} · ${escapeHtml(member.status)}${isSelf ? " · You" : ""}</small>
      </div>
      <div class="member-actions">
        ${member.status !== "approved" ? `<button class="ghost-button" data-action="approve-member" data-user-id="${member.userId}">${icons.check} Approve</button>` : ""}
        ${member.status !== "disabled" && !isSelf ? `<button class="ghost-button danger-action" data-action="disable-member" data-user-id="${member.userId}">Disable</button>` : ""}
        ${member.status === "approved" && member.role !== "admin" ? `<button class="ghost-button" data-action="make-admin" data-user-id="${member.userId}">Make Admin</button>` : ""}
        ${member.status === "approved" && member.role === "admin" && !isSelf ? `<button class="ghost-button" data-action="make-leader" data-user-id="${member.userId}">Make Leader</button>` : ""}
      </div>
    </article>
  `;
}

function renderAccountDetail() {
  return `
    <aside class="detail-panel ${state.detailOpen ? "open" : ""}" aria-label="Account details">
      <button class="detail-close" data-action="close-detail" aria-label="Close details">${icons.x}</button>
      <div class="student-detail-header">
        <div class="student-avatar large">${accountInitials()}</div>
        <span class="section-label">Account</span>
        <h2>${escapeHtml(userDisplayName())}</h2>
      </div>
      ${studentDetailSection("Email", state.user?.email || "No email listed.")}
      ${studentDetailSection("Role", state.member?.role || "leader")}
      ${studentDetailSection("Status", state.member?.status || "pending")}
      ${studentDetailSection("Roster Mode", "Shared Supabase roster for approved youth leaders.")}
      <div class="detail-actions">
        <button class="ghost-button" data-action="refresh-remote-data">${icons.check} Refresh Access</button>
        <button class="ghost-button" data-action="sign-out">Sign out</button>
      </div>
    </aside>
  `;
}

function renderSidebar(taughtCount, upcoming, progress) {
  return `
    <aside class="sidebar">
      <div class="brand-card">
        <img src="./assets/teen-fusion-logo.png" alt="Teen Fusion logo" />
        <div class="brand-lockup">
          <strong>Teen Fusion</strong>
          <span>Youth Curriculum</span>
        </div>
      </div>

      <ul class="nav-list">
        ${navItem("home", "Dashboard", "dashboard", state.activeView === "dashboard")}
        ${navItem("book", "Curriculum", "dashboard")}
        ${navItem("calendar", "Calendar", "calendar", state.activeView === "calendar")}
        ${navItem("users", "My Group", "group", state.activeView === "group")}
        ${navItem("folder", "Resources", "resources", state.activeView === "resources")}
        ${navItem("gear", "Settings", "settings", state.activeView === "settings")}
      </ul>

      <section class="progress-block">
        <h2>Curriculum Progress</h2>
        <div class="progress-orb" style="--progress: ${progress}">
          <div class="progress-orb-inner">
            <div>
              <strong>${taughtCount}</strong>
              <span>of ${state.lessons.length}<br />Weeks Taught</span>
            </div>
          </div>
        </div>
        <div class="progress-legend">
          <div class="legend-row"><span><i class="dot" style="--dot: var(--gold)"></i>Taught</span><strong>${taughtCount}</strong></div>
          <div class="legend-row"><span><i class="dot" style="--dot: var(--blue)"></i>Selected</span><strong>1</strong></div>
          <div class="legend-row"><span><i class="dot" style="--dot: #f2f2f2"></i>Available</span><strong>${upcoming}</strong></div>
          <div class="legend-row"><span><i class="dot" style="--dot: #6f788d"></i>Total</span><strong>${state.lessons.length}</strong></div>
        </div>
        <button class="sidebar-action" data-action="reset-progress">${icons.calendar} Reset Progress</button>
      </section>

      <section class="modules-block">
        <h2>Modules</h2>
        <div class="module-list">
          ${state.modules.map(renderModulePill).join("")}
        </div>
      </section>
    </aside>
  `;
}

function navItem(icon, label, view = "", active = false) {
  return `
    <li>
      <button class="nav-item ${active ? "active" : ""}" type="button" ${view ? `data-action="set-view-page" data-view="${view}"` : ""}>
        <span class="nav-icon">${icons[icon]}</span>
        <span>${label}</span>
      </button>
    </li>
  `;
}

function renderModulePill(module) {
  const count = module.lessons.filter((lesson) => state.taught.has(lesson.week)).length;
  return `
    <div class="module-pill" style="--primary: ${module.primary}">
      <i class="module-swatch"></i>
      <strong>${escapeHtml(module.title)}</strong>
      <span>${count}/${module.lessons.length}</span>
    </div>
  `;
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="title-stack">
        <h1>Curriculum Dashboard</h1>
        <p>Choose the lesson that fits the week, then mark it as taught so the team can keep the year moving without repeating topics.</p>
      </div>
      <div class="toolbar">
        <label class="input-shell">
          ${icons.search}
          <input id="search" type="search" value="${escapeHtml(state.query)}" placeholder="Search lessons..." />
        </label>
        <label class="select-shell">
          <select id="module-filter" aria-label="Filter by module">
            <option value="all">All Modules</option>
            ${state.modules.map((module) => `<option value="${module.number}" ${state.moduleFilter === String(module.number) ? "selected" : ""}>Module ${module.number}: ${escapeHtml(module.title)}</option>`).join("")}
          </select>
        </label>
        <label class="select-shell">
          <select id="status-filter" aria-label="Filter by status">
            <option value="all" ${state.statusFilter === "all" ? "selected" : ""}>All Statuses</option>
            <option value="available" ${state.statusFilter === "available" ? "selected" : ""}>Available</option>
            <option value="taught" ${state.statusFilter === "taught" ? "selected" : ""}>Taught</option>
          </select>
        </label>
      </div>
    </header>
  `;
}

function renderFeatured(lesson) {
  return `
    <section class="featured" style="--primary: ${lesson.primary}; --accent: ${lesson.accent}">
      ${renderLessonArt(lesson)}
      <div class="featured-copy">
        <span class="section-label">Selected Lesson</span>
        <h2>Week ${lesson.week}<br />${escapeHtml(lesson.title)}</h2>
        ${renderScriptureLinks(lesson.scripture, "scripture")}
        <p>${escapeHtml(lesson.bigIdea)}</p>
      </div>
      <div class="featured-actions">
        <button class="primary-button" data-action="toggle-taught" data-week="${lesson.week}">
          ${icons.check} ${state.taught.has(lesson.week) ? "Mark Available" : "Mark as Taught"}
        </button>
        <button class="ghost-button" data-action="open-detail">${icons.notes} View Notes</button>
        <button class="ghost-button" data-action="download-presentation" data-week="${lesson.week}">${icons.download} Download Slides</button>
      </div>
    </section>
  `;
}

function renderLessonCard(lesson) {
  const taught = state.taught.has(lesson.week);
  const active = lesson.week === state.selectedWeek;
  return `
    <article class="lesson-card ${taught ? "taught" : ""} ${active ? "active" : ""}" style="--primary: ${lesson.primary}; --accent: ${lesson.accent}" data-action="select-lesson" data-week="${lesson.week}" role="button" tabindex="0" aria-label="Open Week ${lesson.week}: ${escapeHtml(lesson.title)}">
      <div class="lesson-card-button">
        ${renderLessonArt(lesson)}
        <div class="card-body">
          <div class="week-title">
            <span>Week ${lesson.week}</span>
            <strong>${escapeHtml(lesson.title)}</strong>
          </div>
          ${renderScriptureLinks(lesson.scripture, "scripture-line")}
          <div class="idea-line">${escapeHtml(lesson.bigIdea)}</div>
          <div class="card-foot">
            <div class="module-key"><i class="dot" style="--dot: ${lesson.primary}"></i><span>${escapeHtml(lesson.moduleTitle)}</span></div>
            <div class="status-text">${taught ? icons.check : ""}<span>${taught ? "Taught" : "Available"}</span></div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderLessonArt(lesson) {
  return `
    <div class="lesson-art">
      <img class="lesson-image" src="${lessonImageSrc(lesson)}" alt="" loading="lazy" />
      <span class="week-bubble">${lesson.week}</span>
      <span class="taught-stamp">${icons.check} Taught</span>
    </div>
  `;
}

function renderDetail(lesson) {
  return `
    <aside class="detail-panel ${state.detailOpen ? "open" : ""}" aria-label="Lesson details">
      <button class="detail-close" data-action="close-detail" aria-label="Close details">${icons.x}</button>
      <div class="detail-hero" style="--primary: ${lesson.primary}; --accent: ${lesson.accent}">
        ${renderLessonArt(lesson)}
      </div>
      <div class="detail-header">
        <span class="section-label">Week ${lesson.week}</span>
        <h2>${escapeHtml(lesson.title)}</h2>
        ${renderScriptureLinks(lesson.scripture, "scripture")}
        <span class="tagline">${escapeHtml(lesson.tagline)}</span>
      </div>

      ${renderBigIdeaSection(lesson)}
      ${detailSection("notes", "Creative Hook", lesson.hook)}
      <section class="detail-section">
        <h3>${icons.question} Discussion Questions</h3>
        <ol>
          ${lesson.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}
        </ol>
      </section>
      ${detailSection("book", "Asset Prompt", lesson.assetPrompt)}

      <div class="detail-actions">
        <button class="primary-button" data-action="toggle-taught" data-week="${lesson.week}">
          ${icons.check} ${state.taught.has(lesson.week) ? `Mark Week ${lesson.week} Available` : `Mark Week ${lesson.week} as Taught`}
        </button>
        <button class="ghost-button" data-action="download-presentation" data-week="${lesson.week}">${icons.download} Download Presentation</button>
        <button class="ghost-button" data-action="next-available">Jump to Next Available</button>
      </div>
    </aside>
  `;
}

function renderBigIdeaSection(lesson) {
  const context = lessonContextParagraphs(lesson);
  return `
    <section class="detail-section big-idea-section">
      <h3>${icons.light} Big Idea</h3>
      <p class="idea-statement">${escapeHtml(lesson.bigIdea || "Not listed in the curriculum file.")}</p>
      <div class="idea-context">
        ${context.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      </div>
    </section>
  `;
}

function detailSection(icon, title, body) {
  return `
    <section class="detail-section">
      <h3>${icons[icon]} ${title}</h3>
      <p>${escapeHtml(body || "Not listed in the curriculum file.")}</p>
    </section>
  `;
}

function lessonContextParagraphs(lesson) {
  const lens = lessonContextLens(lesson);
  const focus = lesson.moduleFocus ? ` This fits the broader module focus: ${lesson.moduleFocus.replace(/\.$/, "")}.` : "";
  const title = lesson.title || `Week ${lesson.week}`;
  return [
    `${title} gives the teacher a way to name a real pressure students are already carrying: ${lens.pressure}. Start by letting them describe where they see this tension in normal life before trying to correct it. That makes the conversation feel connected to their world instead of like a lecture dropped on top of it.${focus}`,
    `The goal is to move from surface behavior into the belief underneath it. ${lens.pastoralGoal} Students may nod along with the right answer quickly, so slow the room down and ask what this topic reveals about trust, identity, fear, desire, community, or obedience.`,
    `Before opening the scripture references, invite students to listen for what God reveals about Himself and what He says is true about them. The passage is not just a proof text for the topic; it is a lens for ${lens.response}. Give them one concrete next step they can practice this week, even if that step is small, quiet, or private.`,
  ];
}

function lessonContextLens(lesson) {
  const text = `${lesson.title} ${lesson.bigIdea} ${lesson.tagline} ${lesson.moduleTitle}`.toLowerCase();

  if (matchesAny(text, ["algorithm", "filter", "comparison", "comments", "digital", "deepfakes", "ai-generated", "pornography", "cancel"])) {
    return {
      pressure: "digital spaces constantly measure worth through attention, image, speed, and reaction",
      pastoralGoal: "Help students separate who God says they are from what screens, comments, labels, and private habits tell them they are.",
      response: "discerning truth, practicing integrity online, and choosing freedom over performance",
    };
  }

  if (matchesAny(text, ["anxiety", "depression", "anger", "shame", "storms", "peace"])) {
    return {
      pressure: "emotions can feel overwhelming, isolating, or impossible to explain out loud",
      pastoralGoal: "Give students language for their inner life while showing them that Jesus meets them with both compassion and direction.",
      response: "bringing hidden burdens into God's presence and responding with honesty instead of panic or isolation",
    };
  }

  if (matchesAny(text, ["friends", "dating", "family", "forgiveness", "outsider", "marginalized", "inclusive"])) {
    return {
      pressure: "relationships shape belonging, self-worth, boundaries, loyalty, and wounds more deeply than students often realize",
      pastoralGoal: "Help the group think beyond popularity or drama and toward relationships that reflect the patience, truth, and grace of Jesus.",
      response: "loving people with wisdom, setting healthy boundaries, and practicing restoration where it is possible",
    };
  }

  if (matchesAny(text, ["suffering", "science", "only way", "bible reliable", "doubt", "resurrection", "faith and science"])) {
    return {
      pressure: "students are trying to decide whether faith can stand up to hard questions, pain, evidence, and competing voices",
      pastoralGoal: "Create a room where honest questions are welcomed and where faith is presented as thoughtful trust, not blind denial.",
      response: "seeking truth with courage and letting Jesus become the center of their questions, not the thing they avoid",
    };
  }

  if (matchesAny(text, ["soap", "prayer", "worship", "fasting", "mentor", "bible"])) {
    return {
      pressure: "spiritual habits can feel confusing, boring, performative, or reserved for people who seem more mature",
      pastoralGoal: "Make discipleship feel practical and accessible by showing students how ordinary rhythms can open space for God to shape them.",
      response: "practicing faith in repeatable ways that are honest, sustainable, and rooted in relationship with God",
    };
  }

  if (matchesAny(text, ["moses", "peter", "esther", "gideon", "david", "least of these", "hidden service", "failure"])) {
    return {
      pressure: "students often assume their limits, mistakes, fear, or lack of visibility disqualify them from being used by God",
      pastoralGoal: "Point out that Scripture repeatedly shows God forming people over time and using ordinary obedience in meaningful ways.",
      response: "seeing calling through God's strength instead of personal perfection, popularity, or past failure",
    };
  }

  if (matchesAny(text, ["boundaries", "substances", "integrity", "envy", "gossip", "jealousy"])) {
    return {
      pressure: "temptation often arrives through pressure, escape, secrecy, comparison, or the desire to belong",
      pastoralGoal: "Move the conversation past rule-keeping and toward the heart-level freedom God wants for them.",
      response: "choosing wise boundaries before pressure hits and letting obedience become an act of trust",
    };
  }

  if (matchesAny(text, ["future", "sharing your faith", "justice", "stewardship", "global", "mission"])) {
    return {
      pressure: "students want their lives to matter but may not know how ordinary choices connect to God's larger mission",
      pastoralGoal: "Help them see purpose as something lived today, not something postponed until adulthood or a perfect plan appears.",
      response: "joining God's work through faithfulness, generosity, service, and a willingness to speak about hope",
    };
  }

  if (matchesAny(text, ["holy", "sin", "salvation", "holy spirit", "christmas", "doctrine"])) {
    return {
      pressure: "core beliefs can sound abstract until students see how they explain the deepest parts of guilt, hope, rescue, and worship",
      pastoralGoal: "Translate doctrine into lived reality so students understand not only what Christians believe but why it changes everything.",
      response: "receiving God's rescue with humility and responding to His character with awe, trust, and surrender",
    };
  }

  return {
    pressure: "the topic touches identity, choices, faith, and the way students interpret their everyday world",
    pastoralGoal: "Connect the teaching to real questions students are asking beneath the surface.",
    response: "letting God's truth shape their next decision, conversation, and private thought life",
  };
}

function matchesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

async function downloadLessonPresentation(lesson) {
  const imageBytes = await renderLessonImageAsPng(lesson).catch(() => null);
  const files = buildPresentationFiles(lesson, imageBytes);
  const blob = new Blob([createZip(files)], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${safeFilename(`Week ${lesson.week} ${lesson.title}`)}.pptx`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function renderLessonImageAsPng(lesson) {
  const response = await fetch(lessonImageSrc(lesson));
  if (!response.ok) throw new Error("Lesson image could not be loaded.");
  const svg = await response.text();
  const image = await loadImageFromBlob(new Blob([svg], { type: "image/svg+xml" }));
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 900;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  context.fillStyle = "#050712";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
  if (!blob) throw new Error("Canvas export failed.");
  return new Uint8Array(await blob.arrayBuffer());
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image render failed."));
    };
    image.src = url;
  });
}

function buildPresentationFiles(lesson, imageBytes) {
  const lens = lessonContextLens(lesson);
  const palette = presentationPalette(lesson);
  const scriptures = splitScriptureReferences(lesson.scripture);
  const contextSlides = [
    `Students are carrying this pressure: ${lens.pressure}.`,
    lens.pastoralGoal,
    "Ask what this topic reveals about trust, identity, fear, desire, community, or obedience.",
  ];
  const responseSlides = [
    "Listen for what God reveals about Himself and what He says is true about us.",
    `This week, practice ${lens.response}.`,
  ];
  const slideSpecs = [
    {
      title: lesson.title,
      kicker: `Week ${lesson.week}`,
      subtitle: lesson.tagline,
      body: [scriptures.join("; ")],
      layout: "title",
      image: Boolean(imageBytes),
    },
    {
      title: "The central idea",
      body: [lesson.bigIdea],
      layout: "statement",
    },
    {
      title: "The pressure students feel",
      body: contextSlides,
      layout: "context",
    },
    {
      title: "Open the Scriptures",
      body: scriptures.length
        ? scriptures.map((reference) => `${reference} (${NLT_VERSION})`)
        : ["Scripture references are listed in the lesson notes."],
      footer: "Read for what God reveals about Himself and what He says is true about us.",
      layout: "scripture",
    },
    {
      title: "Start the conversation",
      body: [lesson.hook || "Use the creative hook from the lesson notes to help students enter the topic."],
      layout: "hook",
    },
    {
      title: "Questions for the room",
      body: lesson.questions.length ? lesson.questions.slice(0, 3) : ["What stands out to you from this topic?", "Where do you see this in real life?", "What could obedience look like this week?"],
      layout: "questions",
    },
    {
      title: "This week, practice the truth",
      body: responseSlides,
      footer: "Choose one small, honest next step before you leave.",
      layout: "response",
    },
  ];

  const files = [
    { path: "[Content_Types].xml", data: contentTypesXml(slideSpecs.length, Boolean(imageBytes)) },
    { path: "_rels/.rels", data: rootRelsXml() },
    { path: "docProps/app.xml", data: appPropsXml(slideSpecs.length) },
    { path: "docProps/core.xml", data: corePropsXml(lesson) },
    { path: "ppt/presentation.xml", data: presentationXml(slideSpecs.length) },
    { path: "ppt/_rels/presentation.xml.rels", data: presentationRelsXml(slideSpecs.length) },
    { path: "ppt/theme/theme1.xml", data: themeXml() },
    { path: "ppt/slideMasters/slideMaster1.xml", data: slideMasterXml() },
    { path: "ppt/slideMasters/_rels/slideMaster1.xml.rels", data: slideMasterRelsXml() },
    { path: "ppt/slideLayouts/slideLayout1.xml", data: slideLayoutXml() },
    { path: "ppt/slideLayouts/_rels/slideLayout1.xml.rels", data: slideLayoutRelsXml() },
  ];

  slideSpecs.forEach((spec, index) => {
    const slideNumber = index + 1;
    files.push({
      path: `ppt/slides/slide${slideNumber}.xml`,
      data: slideXml(spec, slideNumber, palette),
    });
    files.push({
      path: `ppt/slides/_rels/slide${slideNumber}.xml.rels`,
      data: slideRelsXml(spec.image && imageBytes),
    });
  });

  if (imageBytes) files.push({ path: "ppt/media/lesson.png", data: imageBytes });
  return files;
}

function slideXml(spec, slideNumber, palette) {
  const elements = [];
  const add = (xml) => elements.push(xml);
  const accent = slideNumber % 2 ? palette.primary : palette.accent;
  add(rectShape(2, 0, 0, 13.333, 7.5, palette.background));
  add(rectShape(3, 0, 0, 13.333, 0.16, accent));
  add(rectShape(4, 0.55, 6.94, 12.25, 0.04, accent, 42000));

  if (spec.layout === "title") {
    if (spec.image) {
      add(picture(5, 6.35, 0.42, 6.45, 3.65));
      add(rectShape(6, 6.1, 0.42, 0.15, 3.65, accent, 65000));
    } else {
      add(rectShape(5, 6.35, 0.62, 5.9, 3.25, palette.panel, 78000));
    }
    add(textBox(7, spec.kicker, 0.72, 0.72, 3.2, 0.42, 18, palette.primary, true));
    add(textBox(8, spec.title, 0.72, 1.18, 5.55, 1.78, 42, "FFFFFF", true));
    add(textBox(9, spec.subtitle || "", 0.72, 3.08, 5.55, 0.58, 22, palette.gold, true));
    add(textBox(10, spec.body, 0.72, 4.1, 5.85, 0.68, 20, "9FC7FF", true));
    add(textBox(11, "Teen Fusion Youth Curriculum", 0.72, 6.25, 4.4, 0.36, 15, "D7DCEB", false));
  } else if (spec.layout === "statement") {
    add(textBox(5, spec.title, 0.72, 0.78, 11.8, 0.65, 34, palette.gold, true));
    add(rectShape(6, 0.78, 1.7, 11.75, 3.55, palette.panel, 82000));
    add(textBox(7, spec.body, 1.12, 2.05, 10.9, 2.5, 30, "FFFFFF", true));
    add(textBox(8, "Let this become the bridge into the Scripture, not a substitute for it.", 1.12, 5.65, 10.7, 0.46, 18, "D7DCEB", false));
  } else if (spec.layout === "scripture") {
    add(textBox(5, spec.title, 0.72, 0.78, 11.8, 0.65, 34, palette.gold, true));
    add(textBox(6, spec.body.map((line) => `• ${line}`), 1.03, 1.85, 11.2, 2.25, 27, "9FC7FF", true));
    add(rectShape(7, 0.92, 4.55, 11.45, 1.1, palette.panel, 78000));
    add(textBox(8, spec.footer, 1.16, 4.86, 10.95, 0.5, 19, "FFFFFF", false));
  } else if (spec.layout === "questions") {
    add(textBox(5, spec.title, 0.72, 0.78, 11.8, 0.65, 34, palette.gold, true));
    add(textBox(6, spec.body.map((question, index) => `${index + 1}. ${shorten(question, 118)}`), 0.95, 1.75, 11.35, 4.25, 24, "FFFFFF", false));
  } else {
    add(textBox(5, spec.title, 0.72, 0.78, 11.8, 0.65, 34, palette.gold, true));
    add(rectShape(6, 0.92, 1.65, 11.5, 4.12, palette.panel, 82000));
    add(textBox(7, spec.body.map((line) => shorten(line, 230)), 1.2, 1.98, 10.9, 3.25, 19, "FFFFFF", false));
    if (spec.footer) add(textBox(8, spec.footer, 1.2, 5.98, 10.8, 0.42, 18, palette.gold, true));
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${elements.join("\n      ")}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function presentationPalette(lesson) {
  const text = `${lesson.assetPrompt} ${lesson.title} ${lesson.moduleTitle}`.toLowerCase();
  if (matchesAny(text, ["water", "storm", "deep", "ocean"])) {
    return { background: "04111E", panel: "0D2634", primary: "4CC9F0", accent: "F6B530", gold: "FFD663" };
  }
  if (matchesAny(text, ["fire", "flame", "anger"])) {
    return { background: "130708", panel: "271011", primary: "F97316", accent: "FFD663", gold: "FFD663" };
  }
  if (matchesAny(text, ["digital", "phone", "ai", "algorithm", "screen", "neon"])) {
    return { background: "050712", panel: "10172A", primary: "60A5FA", accent: "E331D4", gold: "FFD663" };
  }
  if (matchesAny(text, ["crown", "king", "royal", "home"])) {
    return { background: "090815", panel: "19172A", primary: "F6B530", accent: "8B5CF6", gold: "FFD663" };
  }
  if (matchesAny(text, ["cross", "holy", "grace", "sin", "christmas"])) {
    return { background: "070A12", panel: "151923", primary: "F6B530", accent: "60A5FA", gold: "FFD663" };
  }
  return { background: "060915", panel: "111827", primary: stripHex(lesson.primary) || "60A5FA", accent: stripHex(lesson.accent) || "F6B530", gold: "FFD663" };
}

function textBox(id, content, x, y, w, h, fontSize, color, bold = false) {
  const paragraphs = (Array.isArray(content) ? content : [content])
    .filter((line) => String(line || "").trim())
    .map((line) => paragraphXml(line, fontSize, color, bold))
    .join("");
  return `<p:sp>
  <p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
  <p:txBody><a:bodyPr wrap="square" anchor="t"/><a:lstStyle/>${paragraphs}</p:txBody>
</p:sp>`;
}

function paragraphXml(text, fontSize, color, bold) {
  return `<a:p><a:pPr algn="l"/><a:r><a:rPr lang="en-US" sz="${fontSize * 100}"${bold ? ' b="1"' : ""}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="${bold ? "Aptos Display" : "Aptos"}"/></a:rPr><a:t>${escapeXml(text)}</a:t></a:r></a:p>`;
}

function rectShape(id, x, y, w, h, color, alpha = 100000) {
  return `<p:sp>
  <p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${color}"><a:alpha val="${alpha}"/></a:srgbClr></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>
</p:sp>`;
}

function picture(id, x, y, w, h) {
  return `<p:pic>
  <p:nvPicPr><p:cNvPr id="${id}" name="Lesson artwork"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
  <p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
  <p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
</p:pic>`;
}

function contentTypesXml(slideCount, hasImage) {
  const slides = Array.from({ length: slideCount }, (_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${hasImage ? '<Default Extension="png" ContentType="image/png"/>' : ""}
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  ${slides}
</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function presentationXml(slideCount) {
  const slides = Array.from({ length: slideCount }, (_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${slides}</p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle/>
</p:presentation>`;
}

function presentationRelsXml(slideCount) {
  const slides = Array.from({ length: slideCount }, (_, index) => `<Relationship Id="rId${index + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${slides}
</Relationships>`;
}

function slideRelsXml(hasImage) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  ${hasImage ? '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/lesson.png"/>' : ""}
</Relationships>`;
}

function slideMasterXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>`;
}

function slideMasterRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;
}

function slideLayoutXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;
}

function slideLayoutRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;
}

function themeXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Teen Fusion">
  <a:themeElements>
    <a:clrScheme name="Teen Fusion"><a:dk1><a:srgbClr val="050712"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="111827"/></a:dk2><a:lt2><a:srgbClr val="D7DCEB"/></a:lt2><a:accent1><a:srgbClr val="F6B530"/></a:accent1><a:accent2><a:srgbClr val="60A5FA"/></a:accent2><a:accent3><a:srgbClr val="E331D4"/></a:accent3><a:accent4><a:srgbClr val="22C55E"/></a:accent4><a:accent5><a:srgbClr val="F97316"/></a:accent5><a:accent6><a:srgbClr val="8B5CF6"/></a:accent6><a:hlink><a:srgbClr val="60A5FA"/></a:hlink><a:folHlink><a:srgbClr val="8B5CF6"/></a:folHlink></a:clrScheme>
    <a:fontScheme name="Teen Fusion"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="Teen Fusion"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
</a:theme>`;
}

function appPropsXml(slideCount) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Teen Fusion Dashboard</Application><PresentationFormat>On-screen Show (16:9)</PresentationFormat><Slides>${slideCount}</Slides><Company>Teen Fusion</Company>
</Properties>`;
}

function corePropsXml(lesson) {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(`Week ${lesson.week}: ${lesson.title}`)}</dc:title><dc:creator>Teen Fusion Dashboard</dc:creator><cp:lastModifiedBy>Teen Fusion Dashboard</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const pathBytes = encoder.encode(file.path);
    const data = typeof file.data === "string" ? encoder.encode(file.data) : file.data;
    const crc = crc32(data);
    const localHeader = new Uint8Array(30 + pathBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime(), true);
    localView.setUint16(12, dosDate(), true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, pathBytes.length, true);
    localHeader.set(pathBytes, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + pathBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime(), true);
    centralView.setUint16(14, dosDate(), true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, pathBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(pathBytes, 46);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  });

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return concatBytes([...localParts, ...centralParts, end]);
}

function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let cursor = 0;
  parts.forEach((part) => {
    output.set(part, cursor);
    cursor += part.length;
  });
  return output;
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function emu(inches) {
  return Math.round(inches * 914400);
}

function dosTime() {
  const now = new Date();
  return (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
}

function dosDate() {
  const now = new Date();
  return ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
}

function stripHex(value) {
  return String(value || "").replace("#", "").toUpperCase();
}

function shorten(value, maxLength) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function safeFilename(value) {
  return String(value || "presentation").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase();
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function renderScriptureLinks(scripture, className) {
  const references = splitScriptureReferences(scripture);
  return `
    <span class="${className}">
      ${references.map((reference, index) => {
        const divider = index < references.length - 1 ? `<span class="scripture-divider">;</span>` : "";
        return `<a href="${scriptureUrl(reference)}" target="_blank" rel="noopener noreferrer" title="Open ${escapeHtml(reference)} in ${NLT_VERSION}">${escapeHtml(reference)}</a>${divider}`;
      }).join(" ")}
    </span>
  `;
}

function renderEmptyState() {
  return `<div class="empty-state">No lessons match the current filters.</div>`;
}

function bindEvents() {
  document.querySelector(".app-shell")?.addEventListener("click", (event) => {
    const calendarLesson = event.target.closest("[data-action='open-calendar-lesson']");
    if (!calendarLesson) return;
    state.selectedWeek = Number(calendarLesson.dataset.week);
    state.activeView = "dashboard";
    state.detailOpen = true;
    render();
  });

  document.querySelector(".app-shell")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const calendarLesson = event.target.closest(".calendar-cell[data-action='open-calendar-lesson']");
    if (!calendarLesson) return;
    event.preventDefault();
    window.location.hash = `week-${calendarLesson.dataset.week}`;
    state.selectedWeek = Number(calendarLesson.dataset.week);
    state.activeView = "dashboard";
    state.detailOpen = true;
    render();
  });

  document.querySelectorAll("[data-action='select-lesson']").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (event.target.closest("a, button, input, select")) return;
      state.selectedWeek = Number(button.dataset.week);
      state.detailOpen = window.matchMedia("(max-width: 1240px)").matches;
      state.activeView = "dashboard";
      render();
    });

    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      state.selectedWeek = Number(button.dataset.week);
      state.detailOpen = window.matchMedia("(max-width: 1240px)").matches;
      state.activeView = "dashboard";
      render();
    });
  });

  document.querySelectorAll("[data-action='toggle-taught']").forEach((button) => {
    button.addEventListener("click", () => {
      const week = Number(button.dataset.week);
      if (state.taught.has(week)) state.taught.delete(week);
      else state.taught.add(week);
      saveTaught();
      render();
    });
  });

  document.querySelector("[data-action='open-detail']")?.addEventListener("click", () => {
    state.detailOpen = true;
    render();
  });

  document.querySelector("[data-action='close-detail']")?.addEventListener("click", () => {
    state.detailOpen = false;
    render();
  });

  document.querySelector("[data-action='next-available']")?.addEventListener("click", () => {
    state.selectedWeek = firstUntaughtWeek() || state.selectedWeek;
    render();
  });

  document.querySelectorAll("[data-action='download-presentation']").forEach((button) => {
    button.addEventListener("click", async () => {
      const lesson = state.lessons.find((entry) => entry.week === Number(button.dataset.week));
      if (!lesson) return;
      const originalLabel = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `${icons.download} Building slides...`;
      try {
        await downloadLessonPresentation(lesson);
      } catch (error) {
        console.error(error);
        alert("The presentation could not be created. Please try again.");
      } finally {
        button.disabled = false;
        button.innerHTML = originalLabel;
      }
    });
  });

  document.querySelector("[data-action='reset-progress']")?.addEventListener("click", () => {
    if (!state.taught.size || confirm("Reset all taught lessons?")) {
      state.taught.clear();
      saveTaught();
      state.selectedWeek = 1;
      render();
    }
  });

  document.querySelectorAll("[data-action='set-view']").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  document.querySelectorAll("[data-action='set-view-page']").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.view;
      state.detailOpen = false;
      state.studentModalOpen = false;
      state.editingStudentId = "";
      state.resourceModalOpen = false;
      state.editingResourceId = "";
      render();
    });
  });

  document.querySelector("#schedule-start")?.addEventListener("change", (event) => {
    state.scheduleStart = event.target.value || defaultScheduleStart();
    state.calendarCursor = monthKey(parseLocalDate(state.scheduleStart));
    saveScheduleStart();
    render();
  });

  document.querySelectorAll("[data-action='shift-month']").forEach((button) => {
    button.addEventListener("click", () => {
      const cursor = parseMonthKey(state.calendarCursor);
      cursor.setMonth(cursor.getMonth() + Number(button.dataset.shift));
      state.calendarCursor = monthKey(cursor);
      render();
    });
  });

  document.querySelectorAll("[data-action='open-calendar-lesson']").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedWeek = Number(button.dataset.week);
      state.activeView = "dashboard";
      state.detailOpen = true;
      render();
    });
  });

  document.querySelector("[data-action='jump-selected-week']")?.addEventListener("click", () => {
    state.activeView = "dashboard";
    state.detailOpen = true;
    render();
  });

  document.querySelector("[data-action='open-student-modal']")?.addEventListener("click", () => {
    state.editingStudentId = "";
    state.studentModalOpen = true;
    render();
  });

  document.querySelectorAll("[data-action='close-student-modal']").forEach((control) => {
    control.addEventListener("click", (event) => {
      if (event.currentTarget !== event.target && event.currentTarget.classList.contains("modal-backdrop")) return;
      state.studentModalOpen = false;
      state.editingStudentId = "";
      render();
    });
  });

  if (state.studentModalOpen) {
    document.addEventListener("keydown", closeStudentModalOnEscape, { once: true });
  }

  document.querySelector("[data-action='open-resource-modal']")?.addEventListener("click", () => {
    state.editingResourceId = "";
    state.resourceModalOpen = true;
    render();
  });

  document.querySelectorAll("[data-action='close-resource-modal']").forEach((control) => {
    control.addEventListener("click", (event) => {
      if (event.currentTarget !== event.target && event.currentTarget.classList.contains("modal-backdrop")) return;
      state.resourceModalOpen = false;
      state.editingResourceId = "";
      render();
    });
  });

  if (state.resourceModalOpen) {
    document.addEventListener("keydown", closeResourceModalOnEscape, { once: true });
  }

  document.querySelector("#student-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const student = {
      firstName: String(data.get("firstName") || "").trim(),
      lastName: String(data.get("lastName") || "").trim(),
      address: String(data.get("address") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      emergencyName: String(data.get("emergencyName") || "").trim(),
      emergencyPhone: String(data.get("emergencyPhone") || "").trim(),
      notes: String(data.get("notes") || "").trim(),
    };
    if (!student.firstName || !student.lastName) return;
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.innerHTML = `${icons.check} Saving...`;
    try {
      await saveStudentToSupabase(student);
    } catch (error) {
      console.error(error);
      alert(`The student could not be saved: ${error.message}`);
      submitButton.disabled = false;
      submitButton.innerHTML = `${icons.check} ${state.editingStudentId ? "Save Changes" : "Save Student"}`;
      return;
    }
    state.detailOpen = true;
    state.studentModalOpen = false;
    state.editingStudentId = "";
    form.reset();
    render();
  });

  document.querySelectorAll("[data-action='select-student']").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedStudentId = card.dataset.studentId;
      state.detailOpen = window.matchMedia("(max-width: 1240px)").matches;
      render();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      state.selectedStudentId = card.dataset.studentId;
      state.detailOpen = window.matchMedia("(max-width: 1240px)").matches;
      render();
    });
  });

  document.querySelector("[data-action='delete-student']")?.addEventListener("click", async (event) => {
    const student = selectedStudent();
    if (!student) return;
    if (!confirm(`Remove ${studentName(student)} from My Group?`)) return;
    try {
      await deleteStudentFromSupabase(event.currentTarget.dataset.studentId);
      state.editingStudentId = "";
      render();
    } catch (error) {
      console.error(error);
      alert(`The student could not be removed: ${error.message}`);
    }
  });

  document.querySelector("[data-action='edit-student']")?.addEventListener("click", (event) => {
    state.selectedStudentId = event.currentTarget.dataset.studentId;
    state.editingStudentId = event.currentTarget.dataset.studentId;
    state.studentModalOpen = true;
    render();
  });

  document.querySelector("#resource-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const resource = {
      title: String(data.get("title") || "").trim(),
      type: String(data.get("type") || "Note").trim(),
      url: normalizeResourceUrl(String(data.get("url") || "").trim()),
      week: Number(data.get("week")) || "",
      tags: String(data.get("tags") || "").trim(),
      notes: String(data.get("notes") || "").trim(),
    };
    if (!resource.title) return;
    if (state.editingResourceId) {
      const updatedAt = new Date().toISOString();
      state.resources = state.resources.map((entry) => (
        entry.id === state.editingResourceId
          ? { ...entry, ...resource, updatedAt }
          : entry
      ));
      state.selectedResourceId = state.editingResourceId;
    } else {
      const newResource = {
        id: `resource-${Date.now()}`,
        ...resource,
        createdAt: new Date().toISOString(),
      };
      state.resources = [newResource, ...state.resources];
      state.selectedResourceId = newResource.id;
    }
    state.detailOpen = true;
    state.resourceModalOpen = false;
    state.editingResourceId = "";
    saveResources();
    form.reset();
    render();
  });

  document.querySelectorAll("[data-action='select-resource']").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedResourceId = card.dataset.resourceId;
      state.detailOpen = window.matchMedia("(max-width: 1240px)").matches;
      render();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      state.selectedResourceId = card.dataset.resourceId;
      state.detailOpen = window.matchMedia("(max-width: 1240px)").matches;
      render();
    });
  });

  document.querySelector("[data-action='open-resource-lesson']")?.addEventListener("click", (event) => {
    state.selectedWeek = Number(event.currentTarget.dataset.week);
    state.activeView = "dashboard";
    state.detailOpen = true;
    window.location.hash = `week-${state.selectedWeek}`;
    render();
  });

  document.querySelector("[data-action='edit-resource']")?.addEventListener("click", (event) => {
    state.selectedResourceId = event.currentTarget.dataset.resourceId;
    state.editingResourceId = event.currentTarget.dataset.resourceId;
    state.resourceModalOpen = true;
    render();
  });

  document.querySelector("[data-action='delete-resource']")?.addEventListener("click", (event) => {
    const resource = selectedResource();
    if (!resource) return;
    if (!confirm(`Remove "${resource.title}" from Resources?`)) return;
    state.resources = state.resources.filter((entry) => entry.id !== event.currentTarget.dataset.resourceId);
    state.selectedResourceId = state.resources[0]?.id || "";
    saveResources();
    render();
  });

  document.querySelector("#search")?.addEventListener("input", (event) => {
    const search = event.target;
    state.query = search.value;
    window.clearTimeout(searchRenderTimer);
    searchRenderTimer = window.setTimeout(() => {
      pendingSearchSelection = document.activeElement === search
        ? {
            start: search.selectionStart,
            end: search.selectionEnd,
          }
        : null;
      render();
    }, 160);
  });

  document.querySelector("#module-filter")?.addEventListener("change", (event) => {
    state.moduleFilter = event.target.value;
    render();
  });

  document.querySelector("#status-filter")?.addEventListener("change", (event) => {
    state.statusFilter = event.target.value;
    render();
  });

  bindAuthEvents();
  bindMemberAdminEvents();
}

function bindAuthEvents() {
  document.querySelectorAll("[data-action='sign-in-google']").forEach((button) => {
    button.addEventListener("click", signInWithGoogle);
  });

  document.querySelectorAll("[data-action='sign-out']").forEach((button) => {
    button.addEventListener("click", signOut);
  });

  document.querySelectorAll("[data-action='refresh-remote-data']").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.innerHTML = `${icons.check} Refreshing...`;
      await syncAuthSession(state.session);
    });
  });
}

function bindMemberAdminEvents() {
  document.querySelectorAll("[data-action='approve-member']").forEach((button) => {
    button.addEventListener("click", () => handleMemberUpdate(button, {
      status: "approved",
      role: "leader",
    }));
  });

  document.querySelectorAll("[data-action='disable-member']").forEach((button) => {
    button.addEventListener("click", () => {
      if (confirm("Disable this leader account?")) handleMemberUpdate(button, { status: "disabled" });
    });
  });

  document.querySelectorAll("[data-action='make-admin']").forEach((button) => {
    button.addEventListener("click", () => {
      if (confirm("Make this leader an admin? They will be able to approve and disable other leaders.")) {
        handleMemberUpdate(button, { role: "admin", status: "approved" });
      }
    });
  });

  document.querySelectorAll("[data-action='make-leader']").forEach((button) => {
    button.addEventListener("click", () => {
      if (confirm("Change this admin back to a leader?")) handleMemberUpdate(button, { role: "leader" });
    });
  });
}

async function handleMemberUpdate(button, changes) {
  const originalLabel = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `${icons.check} Saving...`;
  try {
    await updateMemberAccess(button.dataset.userId, changes);
    await loadMembersFromSupabase();
    render();
  } catch (error) {
    console.error(error);
    alert(`Leader access could not be updated: ${error.message}`);
    button.disabled = false;
    button.innerHTML = originalLabel;
  }
}

function closeStudentModalOnEscape(event) {
  if (event.key !== "Escape") return;
  state.studentModalOpen = false;
  state.editingStudentId = "";
  render();
}

function restoreSearchFocus() {
  if (!pendingSearchSelection || state.activeView !== "dashboard") {
    pendingSearchSelection = null;
    return;
  }

  const search = document.querySelector("#search");
  if (!search) {
    pendingSearchSelection = null;
    return;
  }

  const start = Math.min(pendingSearchSelection.start ?? search.value.length, search.value.length);
  const end = Math.min(pendingSearchSelection.end ?? start, search.value.length);
  search.focus({ preventScroll: true });
  search.setSelectionRange(start, end);
  pendingSearchSelection = null;
}

function closeResourceModalOnEscape(event) {
  if (event.key !== "Escape") return;
  state.resourceModalOpen = false;
  state.editingResourceId = "";
  render();
}

function filteredLessons() {
  const query = state.query.trim().toLowerCase();
  return state.lessons.filter((lesson) => {
    const taught = state.taught.has(lesson.week);
    const searchable = [
      lesson.title,
      lesson.scripture,
      lesson.bigIdea,
      lesson.hook,
      lesson.tagline,
      lesson.moduleTitle,
    ].join(" ").toLowerCase();

    if (state.moduleFilter !== "all" && String(lesson.moduleNumber) !== state.moduleFilter) return false;
    if (state.statusFilter === "taught" && !taught) return false;
    if (state.statusFilter === "available" && taught) return false;
    if (query && !searchable.includes(query)) return false;
    return true;
  });
}

function getSelectedLesson() {
  return state.lessons.find((lesson) => lesson.week === state.selectedWeek) || state.lessons[0];
}

function applyHashSelection() {
  const match = window.location.hash.match(/^#week-(\d+)$/);
  if (!match) return false;
  const week = Number(match[1]);
  if (!state.lessons.some((lesson) => lesson.week === week)) return false;
  state.selectedWeek = week;
  state.activeView = "dashboard";
  state.detailOpen = true;
  return true;
}

function firstUntaughtWeek() {
  return state.lessons.find((lesson) => !state.taught.has(lesson.week))?.week;
}

function loadTaught() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveTaught() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.taught].sort((a, b) => a - b)));
}

function loadResources() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RESOURCES_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveResources() {
  localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(state.resources));
}

function selectedStudent() {
  return state.students.find((student) => student.id === state.selectedStudentId) || state.students[0];
}

function editingStudent() {
  return state.students.find((student) => student.id === state.editingStudentId) || null;
}

function selectedResource() {
  return state.resources.find((resource) => resource.id === state.selectedResourceId) || state.resources[0];
}

function editingResource() {
  return state.resources.find((resource) => resource.id === state.editingResourceId) || null;
}

function lessonForResource(resource) {
  if (!resource?.week) return null;
  return state.lessons.find((lesson) => lesson.week === Number(resource.week)) || null;
}

function normalizeResourceUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function resourceHost(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function formatResourceDate(value) {
  if (!value) return "Date not listed.";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function studentName(student) {
  return `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Unnamed Student";
}

function studentInitials(student) {
  return `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase() || "TF";
}

function loadScheduleStart() {
  return localStorage.getItem(SCHEDULE_START_KEY) || defaultScheduleStart();
}

function saveScheduleStart() {
  localStorage.setItem(SCHEDULE_START_KEY, state.scheduleStart);
}

function defaultScheduleStart() {
  const date = startOfToday();
  const daysUntilSunday = (7 - date.getDay()) % 7;
  return isoDate(addDays(date, daysUntilSunday));
}

function lessonsWithDates() {
  const start = parseLocalDate(state.scheduleStart);
  return state.lessons.flatMap((lesson) => {
    const lessonDate = addDays(start, (lesson.week - 1) * 7);
    return [
      {
        lesson,
        date: lessonDate,
        type: "lesson",
      },
      {
        lesson,
        date: addDays(lessonDate, 3),
        type: "carryover",
      },
    ];
  });
}

function lessonImageSrc(lesson) {
  return `./assets/lesson-images/week-${String(lesson.week).padStart(2, "0")}.svg`;
}

function splitScriptureReferences(scripture) {
  return String(scripture)
    .split(";")
    .map((reference) => reference.trim())
    .filter(Boolean);
}

function scriptureUrl(reference) {
  const params = new URLSearchParams({
    search: reference,
    version: NLT_VERSION,
  });
  return `https://www.biblegateway.com/passage/?${params.toString()}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function parseMonthKey(value) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDate(first, second) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthTitle(date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(date);
}

function chooseArtIcon(lesson) {
  const text = `${lesson.title} ${lesson.assetPrompt} ${lesson.moduleTitle}`.toLowerCase();
  if (/phone|screen|scroll|keyboard|digital|ai|algorithm|notification/.test(text)) return artIcons.phone;
  if (/anxiety|surface|water|storm|deep|peace|chaos|submerg|hurricane/.test(text)) return artIcons.water;
  if (/anger|fire|flame|fuel|fasting/.test(text)) return artIcons.flame;
  if (/home|adopt|king|crown|calling/.test(text)) return artIcons.crown;
  if (/friend|squad|relationship|honor|forgive|mentor|church/.test(text)) return artIcons.people;
  if (/doubt|science|trust|why|truth|bible/.test(text)) return artIcons.question;
  if (/cross|grace|sin|holy|jesus|incarnation/.test(text)) return artIcons.cross;
  if (/pressure|integrity|armor|tongue|line/.test(text)) return artIcons.shield;
  if (/purpose|routine|path|global|evangelism/.test(text)) return artIcons.path;
  if (/heart|body|worship|prayer/.test(text)) return artIcons.heart;
  return artIcons.identity;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
