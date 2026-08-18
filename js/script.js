// ===========================================================
// Shared: date header (runs on every page)
// ===========================================================

var now = new Date();
var date = now.toDateString().slice(4);

document.getElementById("date").textContent = "Date: " + date;

// ===========================================================
// Shared helpers (used by more than one page)
// ===========================================================

var subjectNames = {
  physics: "Physics",
  chemistry: "Chemistry",
  mathematics: "Mathematics",
  "computer-science": "Computer Science",
  english: "English"
};

var STORAGE_KEYS = {
  assignments: "campusbuddy-assignments",
  attendance: "campusbuddy-attendance",
  exams: "campusbuddy-exams"
};

function ordinalSuffix(day) {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

// "2026-11-05" -> "5th November 2026"
function formatDateLong(dateStr) {
  var d = new Date(dateStr + "T00:00:00");
  var day = d.getDate();
  var month = d.toLocaleString("en-US", { month: "long" });
  var year = d.getFullYear();
  return day + ordinalSuffix(day) + " " + month + " " + year;
}

// "2026-11-12" -> "12 Nov 2026"
function formatDateShort(dateStr) {
  var d = new Date(dateStr + "T00:00:00");
  var day = d.getDate();
  var month = d.toLocaleString("en-US", { month: "short" });
  var year = d.getFullYear();
  return day + " " + month + " " + year;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function percent(part, total) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

// ---- Shared loaders (same seed data as each page's own default) ----

function loadAssignments() {
  var stored = localStorage.getItem(STORAGE_KEYS.assignments);
  if (stored) return JSON.parse(stored);
  return [
    { id: 1, subject: "physics", description: "Worksheet", dueDate: "2026-11-05", completed: false, completedDate: null },
    { id: 2, subject: "chemistry", description: "Activity", dueDate: "2026-11-15", completed: false, completedDate: null },
    { id: 3, subject: "computer-science", description: "Record", dueDate: "2026-11-19", completed: false, completedDate: null },
    { id: 4, subject: "mathematics", description: "Worksheet", dueDate: "2026-10-30", completed: true, completedDate: "2026-10-30" }
  ];
}

function saveAssignments(assignments) {
  localStorage.setItem(STORAGE_KEYS.assignments, JSON.stringify(assignments));
}

function loadAttendance() {
  var stored = localStorage.getItem(STORAGE_KEYS.attendance);
  if (stored) return JSON.parse(stored);
  return {
    subjects: [
      { name: "Physics", attended: 72, total: 75 },
      { name: "Chemistry", attended: 99, total: 100 },
      { name: "Mathematics", attended: 57, total: 60 },
      { name: "Computer Science", attended: 49, total: 50 },
      { name: "English", attended: 97, total: 100 }
    ],
    totalClasses: 203,
    missed: 5,
    attended: 198,
    lastRecorded: null
  };
}

function saveAttendance(state) {
  localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(state));
}

function loadExams() {
  var stored = localStorage.getItem(STORAGE_KEYS.exams);
  if (stored) return JSON.parse(stored);
  return [
    { id: 1, subject: "physics", examName: "Midterm", date: "2026-11-12", maxMarks: 100, marksScored: null },
    { id: 2, subject: "chemistry", examName: "Midterm", date: "2026-11-18", maxMarks: 100, marksScored: null },
    { id: 3, subject: "physics", examName: "Midterm", date: "2026-10-20", maxMarks: 100, marksScored: 92 }
  ];
}

function saveExams(exams) {
  localStorage.setItem(STORAGE_KEYS.exams, JSON.stringify(exams));
}

// ===========================================================
// Dashboard page (index.html)
// ===========================================================

(function initDashboardPage() {
  var cardsContainer = document.querySelector(".cards");
  if (!cardsContainer) return; // not on the dashboard, skip this section

  // ---- Upcoming Exam card ----
  var examCard = document.querySelector(".card.exam p");
  if (examCard) {
    var exams = loadExams();
    var upcomingExams = exams
      .filter(function (e) { return e.date > todayISO(); })
      .sort(function (a, b) { return a.date.localeCompare(b.date); });

    if (upcomingExams.length === 0) {
      examCard.textContent = "None";
    } else {
      var nextExam = upcomingExams[0];
      examCard.textContent = subjectNames[nextExam.subject] + " " + nextExam.examName +
        " - " + formatDateShort(nextExam.date);
    }
  }

  // ---- Assignments card ----
  var assignmentsCard = document.querySelector(".card.assignments p");
  if (assignmentsCard) {
    var assignments = loadAssignments();
    var pendingAssignments = assignments
      .filter(function (a) { return !a.completed; })
      .sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); });

    if (pendingAssignments.length === 0) {
      assignmentsCard.textContent = "No assignments due";
    } else {
      var nextAssignment = pendingAssignments[0];
      var dateText = formatDateLong(nextAssignment.dueDate).toLowerCase();
      assignmentsCard.textContent = subjectNames[nextAssignment.subject] + " " +
        nextAssignment.description.toLowerCase() + " due on " + dateText;
    }
  }

  // ---- Stats card (only the Attendance line; SGPA/CGPA stay static) ----
  var statsParagraphs = document.querySelectorAll(".card.stats p");
  if (statsParagraphs.length > 0) {
    var attendanceState = loadAttendance();
    var attendancePercent = percent(attendanceState.attended, attendanceState.totalClasses);
    statsParagraphs[0].textContent = "Attendance: " + attendancePercent + "%";
  }

  // ---- Today's Focus card: add a dynamic line below the static one ----
  var focusCard = document.querySelector(".card.focus");
  if (focusCard) {
    var focusAlertText = getFocusAlertText();
    if (focusAlertText) {
      var focusAlert = document.createElement("p");
      focusAlert.className = "focus-alert";
      focusAlert.textContent = focusAlertText;
      focusCard.appendChild(focusAlert);
    }
  }

  // Today's Timetable is left as static HTML, as requested.
})();

// Priority: low attendance warning > soonest of (next exam, next pending assignment).
// Returns null if there's nothing worth flagging.
function getFocusAlertText() {
  var attendanceState = loadAttendance();
  var attendancePercent = percent(attendanceState.attended, attendanceState.totalClasses);

  if (attendancePercent < 75) {
    return "⚠️ Attendance is low: " + attendancePercent + "%";
  }

  var exams = loadExams();
  var assignments = loadAssignments();

  var nextExam = exams
    .filter(function (e) { return e.date > todayISO(); })
    .sort(function (a, b) { return a.date.localeCompare(b.date); })[0];

  var nextAssignment = assignments
    .filter(function (a) { return !a.completed; })
    .sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); })[0];

  var candidates = [];
  if (nextExam) {
    candidates.push({
      date: nextExam.date,
      text: "📌 Next up: " + subjectNames[nextExam.subject] + " " + nextExam.examName +
        " on " + formatDateShort(nextExam.date)
    });
  }
  if (nextAssignment) {
    candidates.push({
      date: nextAssignment.dueDate,
      text: "📌 Next up: " + subjectNames[nextAssignment.subject] + " " + nextAssignment.description +
        " due " + formatDateShort(nextAssignment.dueDate)
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort(function (a, b) { return a.date.localeCompare(b.date); });
  return candidates[0].text;
}

// ===========================================================
// Assignments page (assignments.html)
// ===========================================================

(function initAssignmentsPage() {
  var form = document.querySelector(".add-asgm form");
  if (!form) return; // not on the assignments page, skip this section

  var assignments = loadAssignments();

  function isToday(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }

  function createCard(item) {
    var card = document.createElement("div");
    card.className = "card" + (item.completed ? " completed" : "");
    card.dataset.id = item.id;

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.completed;
    checkbox.addEventListener("change", function () {
      toggleCompleted(item.id, checkbox.checked);
    });

    var title = document.createElement("h3");
    title.textContent = subjectNames[item.subject] + ": " + item.description;

    var meta = document.createElement("p");
    meta.textContent = item.completed
      ? "completed on " + formatDateLong(item.completedDate || item.dueDate)
      : "due on " + formatDateLong(item.dueDate);

    card.appendChild(checkbox);
    card.appendChild(title);
    card.appendChild(meta);
    return card;
  }

  function toggleEmptyMessage(container, count, message) {
    var existing = container.querySelector(".empty-msg");
    if (count === 0) {
      if (!existing) {
        var p = document.createElement("p");
        p.className = "empty-msg";
        p.textContent = message;
        container.appendChild(p);
      }
    } else if (existing) {
      existing.remove();
    }
  }

  function render() {
    var dueTodayContainer = document.querySelector(".top-asgm");
    var upcomingContainer = document.querySelector(".asgm");
    var completedContainer = document.querySelector(".completed-list");

    [dueTodayContainer, upcomingContainer, completedContainer].forEach(function (container) {
      container.querySelectorAll(".card").forEach(function (c) { c.remove(); });
    });

    var active = assignments.filter(function (a) { return !a.completed; });
    var completed = assignments.filter(function (a) { return a.completed; });

    var dueToday = active.filter(function (a) { return isToday(a.dueDate); });
    var upcoming = active
      .filter(function (a) { return !isToday(a.dueDate); })
      .sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); });

    completed.sort(function (a, b) {
      return (b.completedDate || b.dueDate).localeCompare(a.completedDate || a.dueDate);
    });

    dueToday.forEach(function (a) { dueTodayContainer.appendChild(createCard(a)); });
    upcoming.forEach(function (a) { upcomingContainer.appendChild(createCard(a)); });
    completed.forEach(function (a) { completedContainer.appendChild(createCard(a)); });

    toggleEmptyMessage(dueTodayContainer, dueToday.length, "Nothing due today 🎉");
    toggleEmptyMessage(upcomingContainer, upcoming.length, "No upcoming assignments");
    toggleEmptyMessage(completedContainer, completed.length, "Nothing completed yet");
  }

  function toggleCompleted(id, isCompleted) {
    var item = assignments.find(function (a) { return a.id === id; });
    if (!item) return;

    item.completed = isCompleted;
    item.completedDate = isCompleted ? todayISO() : null;

    saveAssignments(assignments);
    render();
  }

  function addAssignment(subject, description, dueDate) {
    var newId = assignments.length
      ? Math.max.apply(null, assignments.map(function (a) { return a.id; })) + 1
      : 1;

    assignments.push({
      id: newId,
      subject: subject,
      description: description,
      dueDate: dueDate,
      completed: false,
      completedDate: null
    });

    saveAssignments(assignments);
    render();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var subject = document.getElementById("subject").value;
    var description = document.getElementById("description").value.trim();
    var dueDate = document.getElementById("due-date").value;

    if (!subject || !description || !dueDate) {
      alert("Please fill in all fields before adding an assignment.");
      return;
    }

    addAssignment(subject, description, dueDate);
    form.reset();
  });

  render();
})();

// ===========================================================
// Attendance page (attendance.html)
// ===========================================================

(function initAttendancePage() {
  var form = document.querySelector(".attendance-form");
  if (!form) return; // not on the attendance page, skip this section

  var TODAYS_SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Computer Science"];
  var state = loadAttendance();

  function overallPercent() {
    return percent(state.attended, state.totalClasses);
  }

  function renderOverall() {
    var section = document.querySelector(".overall-attendance");
    section.querySelector("p").textContent = overallPercent() + "%";
  }

  function renderSubjects() {
    var section = document.querySelector(".subject-attendance");
    var subjectEls = section.querySelectorAll(".subject");

    state.subjects.forEach(function (subject, i) {
      var el = subjectEls[i];
      if (!el) return;

      var pct = percent(subject.attended, subject.total);
      el.querySelector(".subject-header span:last-child").textContent = pct + "%";
      el.querySelector(".progress-fill").style.width = pct + "%";
    });
  }

  function renderStats() {
    var section = document.querySelector(".attendance-stats");
    var paragraphs = section.querySelectorAll("p");
    paragraphs[0].textContent = "Total classes: " + state.totalClasses;
    paragraphs[1].textContent = "Classes missed: " + state.missed;
    paragraphs[2].textContent = "Attended classes: " + state.attended;
  }

  function renderForm() {
    var button = form.querySelector("button");
    var alreadyRecordedToday = state.lastRecorded === todayISO();

    form.querySelectorAll("input[type='checkbox']").forEach(function (checkbox) {
      checkbox.disabled = alreadyRecordedToday;
    });

    button.disabled = alreadyRecordedToday;
    button.textContent = alreadyRecordedToday ? "Attendance Saved" : "Save Attendance";
  }

  function render() {
    renderOverall();
    renderSubjects();
    renderStats();
    renderForm();
  }

  function recordAttendance(checkedSubjects) {
    TODAYS_SUBJECTS.forEach(function (name) {
      var subject = state.subjects.find(function (s) { return s.name === name; });
      if (!subject) return;

      subject.total += 1;
      if (checkedSubjects.indexOf(name) !== -1) {
        subject.attended += 1;
      }
    });

    var missedToday = TODAYS_SUBJECTS.length - checkedSubjects.length;

    state.totalClasses += TODAYS_SUBJECTS.length;
    state.attended += checkedSubjects.length;
    state.missed += missedToday;
    state.lastRecorded = todayISO();

    saveAttendance(state);
    render();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (state.lastRecorded === todayISO()) {
      alert("You've already saved today's attendance.");
      return;
    }

    var checkedSubjects = [];
    form.querySelectorAll("input[type='checkbox']").forEach(function (checkbox, i) {
      if (checkbox.checked) {
        checkedSubjects.push(TODAYS_SUBJECTS[i]);
      }
    });

    recordAttendance(checkedSubjects);
  });

  render();
})();

// ===========================================================
// Academics page (academics.html)
// ===========================================================

(function initAcademicsPage() {
  var form = document.querySelector(".add-exam form");
  if (!form) return; // not on the academics page, skip this section

  var exams = loadExams();

  function hasHappened(exam) {
    return exam.date <= todayISO();
  }

  function createUpcomingCard(exam) {
    var card = document.createElement("div");
    card.className = "card";
    card.dataset.id = exam.id;

    var title = document.createElement("p");
    title.textContent = subjectNames[exam.subject] + " " + exam.examName;

    var dateEl = document.createElement("p");
    dateEl.textContent = formatDateShort(exam.date);

    card.appendChild(title);
    card.appendChild(dateEl);
    return card;
  }

  function createResultCard(exam) {
    var card = document.createElement("div");
    card.className = "card";
    card.dataset.id = exam.id;

    var title = document.createElement("p");
    title.textContent = subjectNames[exam.subject] + " " + exam.examName;

    var scoreEl = document.createElement("span");
    scoreEl.textContent = exam.marksScored === null
      ? "Awaiting marks"
      : exam.marksScored + " / " + exam.maxMarks;

    var button = document.createElement("button");
    button.textContent = exam.marksScored === null ? "Enter Marks" : "Edit Marks";
    button.addEventListener("click", function () {
      openMarksModal(exam.id);
    });

    card.appendChild(title);
    card.appendChild(scoreEl);
    card.appendChild(button);
    return card;
  }

  function toggleEmptyMessage(container, count, message) {
    var existing = container.querySelector(".empty-msg");
    if (count === 0) {
      if (!existing) {
        var p = document.createElement("p");
        p.className = "empty-msg";
        p.textContent = message;
        container.appendChild(p);
      }
    } else if (existing) {
      existing.remove();
    }
  }

  function render() {
    var upcomingContainer = document.querySelector(".upcoming-exams");
    var resultsContainer = document.querySelector(".exam-results");

    [upcomingContainer, resultsContainer].forEach(function (container) {
      container.querySelectorAll(".card").forEach(function (c) { c.remove(); });
    });

    var upcoming = exams
      .filter(function (e) { return !hasHappened(e); })
      .sort(function (a, b) { return a.date.localeCompare(b.date); });

    var results = exams
      .filter(function (e) { return hasHappened(e); })
      .sort(function (a, b) { return b.date.localeCompare(a.date); });

    upcoming.forEach(function (e) { upcomingContainer.appendChild(createUpcomingCard(e)); });
    results.forEach(function (e) { resultsContainer.appendChild(createResultCard(e)); });

    toggleEmptyMessage(upcomingContainer, upcoming.length, "No upcoming exams");
    toggleEmptyMessage(resultsContainer, results.length, "No results yet");
  }

  function closeMarksModal() {
    var existing = document.querySelector(".marks-modal-overlay");
    if (existing) existing.remove();
  }

  function openMarksModal(id) {
    var exam = exams.find(function (e) { return e.id === id; });
    if (!exam) return;

    closeMarksModal(); // in case one is already open

    var overlay = document.createElement("div");
    overlay.className = "marks-modal-overlay";
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%;" +
      "background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000;";

    var modal = document.createElement("div");
    modal.style.cssText = "background:#fff; padding:1.5rem; border-radius:8px; min-width:260px;" +
      "max-width:90%; box-shadow:0 4px 20px rgba(0,0,0,0.2); font-family:inherit;";

    var heading = document.createElement("h3");
    heading.style.marginTop = "0";
    heading.textContent = exam.marksScored === null ? "Enter marks" : "Edit marks";

    var subtext = document.createElement("p");
    subtext.style.cssText = "margin-top:-0.5rem; color:#555;";
    subtext.textContent = subjectNames[exam.subject] + " " + exam.examName +
      " (out of " + exam.maxMarks + ")";

    var input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = exam.maxMarks;
    input.value = exam.marksScored === null ? "" : exam.marksScored;
    input.style.cssText = "width:100%; box-sizing:border-box; padding:0.5rem; margin-bottom:0.5rem;" +
      "font-size:1rem;";

    var errorMsg = document.createElement("p");
    errorMsg.style.cssText = "color:#c0392b; font-size:0.9rem; display:none; margin:0 0 0.5rem;";

    var buttonRow = document.createElement("div");
    buttonRow.style.cssText = "display:flex; gap:0.5rem; justify-content:flex-end;";

    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", closeMarksModal);

    var saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", function () {
      var marks = Number(input.value);
      if (input.value.trim() === "" || isNaN(marks) || marks < 0 || marks > exam.maxMarks) {
        errorMsg.textContent = "Please enter a number between 0 and " + exam.maxMarks + ".";
        errorMsg.style.display = "block";
        return;
      }
      exam.marksScored = marks;
      saveExams(exams);
      closeMarksModal();
      render();
    });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeMarksModal();
    });

    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(saveBtn);

    modal.appendChild(heading);
    modal.appendChild(subtext);
    modal.appendChild(input);
    modal.appendChild(errorMsg);
    modal.appendChild(buttonRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    input.focus();
  }

  function addExam(subject, examName, examDate, maxMarks) {
    var newId = exams.length
      ? Math.max.apply(null, exams.map(function (e) { return e.id; })) + 1
      : 1;

    exams.push({
      id: newId,
      subject: subject,
      examName: examName,
      date: examDate,
      maxMarks: maxMarks,
      marksScored: null
    });

    saveExams(exams);
    render();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var subject = form.querySelector("#subject").value;
    var examName = form.querySelector("#exam-name").value.trim();
    var examDate = form.querySelector("#date").value;
    var maxMarks = Number(form.querySelector("#maximum-marks").value);

    if (!subject || !examName || !examDate || !maxMarks || maxMarks <= 0) {
      alert("Please fill in all fields with valid values before adding an exam.");
      return;
    }

    addExam(subject, examName, examDate, maxMarks);
    form.reset();
  });

  render();
})();