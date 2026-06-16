// State Management
let associates = [];
let activeAssociateId = "sarah-chen";
let currentUser = null;
let activeTab = "dashboard";
let notifications = [];

// Initialize Page
document.addEventListener("DOMContentLoaded", () => {
  // Load Theme
  const savedTheme = localStorage.getItem("hrms_theme") || "light";
  setTheme(savedTheme);

  // Load User Authentication
  checkAuth();

  // Attach Form Submit Listener
  const evalForm = document.getElementById("evaluation-form");
  if (evalForm) {
    evalForm.addEventListener("submit", handleSaveEvaluation);
  }

  // Load Initial Notifications
  loadMockNotifications();
});

// Authentication System
function checkAuth() {
  const sessionUser = window.authService ? authService.getCurrentUser() : null;
  const storedUser = sessionUser && sessionUser.role === "manager"
    ? JSON.stringify(sessionUser)
    : localStorage.getItem("hrms_manager");
  const loginScreen = document.getElementById("login-screen");
  
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    localStorage.setItem("hrms_manager", JSON.stringify(currentUser));
    if (loginScreen) {
      loginScreen.classList.add("hidden");
    }
    // Update Header
    document.getElementById("header-avatar").src = currentUser.avatar;
    
    // Fetch Associates list
    fetchAssociates();
  } else {
    if (loginScreen) {
      loginScreen.classList.remove("hidden");
    }
  }
}

function loginAs(name, avatar) {
  const user = { name, avatar };
  localStorage.getItem("hrms_manager");
  localStorage.setItem("hrms_manager", JSON.stringify(user));
  currentUser = user;
  
  const loginScreen = document.getElementById("login-screen");
  if (loginScreen) {
    loginScreen.classList.add("opacity-0");
    setTimeout(() => {
      loginScreen.classList.add("hidden");
      loginScreen.classList.remove("opacity-0");
    }, 300);
  }
  
  document.getElementById("header-avatar").src = currentUser.avatar;
  addNotification(`Signed in as ${name}`, "success");
  
  fetchAssociates();
}

function getManagers() {
  let managers = localStorage.getItem("hrms_registered_managers");
  if (!managers) {
    managers = [
      { name: "Sarah Thompson", email: "manager@sundew.com", password: "password123", role: "Lead HR Manager", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCEBSgyvWhWcUFD0_sFk0Z5fn365kbumbRqrv0GfIZuJzhpIr_eUJNWeIBGOl3ilIv7K2R5i4SFlgLPUmMLkSojNB61S0Y-tspj1SNDCxbSMr327OASz9b24mdOjMqUvq2GKMtN4H5b8Se1gxiKRGOkQKZgNqW7QE59DYjL4guWRIGz4azjNWxeGTr8iJBEJBzwMmY-49ETYtOTynhsY_SqQ6vOxPyxzNOP3VZLhi8Skrjr1D3s7TyorKUMJf9YiCbHAmFsV07M9c" },
      { name: "Marcus Vance", email: "marcus@sundew.com", password: "password123", role: "Reporting Manager (RM)", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200" }
    ];
    localStorage.setItem("hrms_registered_managers", JSON.stringify(managers));
  } else {
    managers = JSON.parse(managers);
  }
  return managers;
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  
  const managers = getManagers();
  const user = managers.find(m => m.email === email && m.password === password);
  
  if (user) {
    loginAs(user.name, user.avatar);
  } else {
    alert("Invalid credentials.");
  }
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const role = document.getElementById("reg-role").value;
  
  const managers = getManagers();
  if (managers.some(m => m.email === email)) {
    alert("User with this email already exists.");
    return;
  }
  
  const newUser = {
    name, email, password, role, avatar: "https://ui-avatars.com/api/?name=" + encodeURIComponent(name) + "&background=random"
  };
  managers.push(newUser);
  localStorage.setItem("hrms_registered_managers", JSON.stringify(managers));
  
  loginAs(newUser.name, newUser.avatar);
}

function toggleAuthMode(mode) {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  if (mode === "register") {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
  } else {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  }
}

function logout() {
  localStorage.removeItem("hrms_manager");
  if (window.authService) authService.logout();
  currentUser = null;
  const loginScreen = document.getElementById("login-screen");
  if (loginScreen) {
    loginScreen.classList.remove("hidden");
  }
  addNotification("Logged out successfully", "info");
}

// Fetch associates from backend
async function fetchAssociates() {
  try {
    const response = await fetch('/api/associates');
    if (!response.ok) throw new Error("Failed to fetch associates");
    associates = await response.ok ? await response.json() : [];
    
    renderAssociateList();
    renderTeamGrid();
    renderEvaluationLog();
    renderReports();
    
    // Select default active associate
    if (associates.length > 0) {
      // Find active index, fallback if deleted
      const exists = associates.some(a => a.id === activeAssociateId);
      if (!exists) {
        activeAssociateId = associates[0].id;
      }
      selectAssociate(activeAssociateId);
    }
  } catch (error) {
    console.error("Error fetching associates:", error);
    addNotification("Backend communication error. Using mock offline fallback.", "error");
  }
}

// Render left sidebar list
function renderAssociateList() {
  const container = document.getElementById("associate-list");
  if (!container) return;
  
  let managerListHtml = "";
  associates.forEach(associate => {
    const isActive = associate.id === activeAssociateId;
    const activeClass = isActive 
      ? "bg-secondary text-white font-semibold" 
      : "text-on-surface-variant hover:bg-surface-container-high";
    
    const statusDotColor = associate.status === "On Track" ? "bg-[#15803d]" : "bg-error";
    
    managerListHtml += `
      <button onclick="selectAssociate('${associate.id}')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-all focus:outline-none mb-1 ${activeClass}">
        <div class="flex items-center gap-3">
          <img class="w-8 h-8 rounded-full object-cover border border-outline-variant/30" src="${associate.avatar}" alt="${associate.name}">
          <span class="truncate">${associate.name}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full ${statusDotColor} border border-white/20"></span>
        </div>
      </button>
    `;
  });

  container.innerHTML = `
    <div class="mb-2">
      <div class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-3 mb-2 flex justify-between items-center cursor-pointer" onclick="document.getElementById('manager-section').classList.toggle('hidden')">
        <span>Manager</span>
        <span class="material-symbols-outlined text-[16px]">expand_more</span>
      </div>
      <div id="manager-section" class="space-y-1">
        ${managerListHtml}
      </div>
    </div>
    <div class="mb-2">
      <div class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-3 mb-2 flex justify-between items-center cursor-pointer opacity-50" onclick="document.getElementById('hr-section').classList.toggle('hidden')">
        <span>HR</span>
        <span class="material-symbols-outlined text-[16px]">chevron_right</span>
      </div>
      <div id="hr-section" class="hidden space-y-1">
      </div>
    </div>
    <div class="mb-2">
      <div class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-3 mb-2 flex justify-between items-center cursor-pointer opacity-50" onclick="document.getElementById('associates-section').classList.toggle('hidden')">
        <span>Associates</span>
        <span class="material-symbols-outlined text-[16px]">chevron_right</span>
      </div>
      <div id="associates-section" class="hidden space-y-1">
      </div>
    </div>
  `;
}

// Selection handling
async function selectAssociate(id) {
  activeAssociateId = id;
  renderAssociateList();
  
  // Fetch detailed data
  try {
    const response = await fetch(`/api/associates/${id}`);
    if (!response.ok) throw new Error("Failed to fetch associate details");
    const associate = await response.json();
    
    // Update State
    const index = associates.findIndex(a => a.id === id);
    if (index !== -1) {
      associates[index] = associate;
    }
    
    // Update Right Profile Panel
    document.getElementById("p-avatar").src = associate.avatar;
    document.getElementById("p-name").innerText = associate.name;
    document.getElementById("p-id").innerText = associate.employeeId;
    document.getElementById("p-join").innerText = associate.joinDate;
    document.getElementById("p-manager").innerText = associate.manager;
    document.getElementById("p-probation").innerText = associate.probation;
    
    const statusBadge = document.getElementById("p-status");
    statusBadge.innerText = associate.status;
    if (associate.status === "On Track") {
      statusBadge.className = "inline-flex px-3 py-1 bg-[#15803d]/10 text-[#15803d] border border-[#15803d]/20 rounded-full text-xs font-bold w-fit";
    } else {
      statusBadge.className = "inline-flex px-3 py-1 bg-error/10 text-error border border-error/20 rounded-full text-xs font-bold w-fit";
    }
    
    // Update project
    document.getElementById("p-project-name").innerText = associate.project.name;
    document.getElementById("p-project-phase").innerText = `Phase: ${associate.project.phase}`;
    document.getElementById("p-project-progress-text").innerText = `${associate.project.progress}%`;
    document.getElementById("p-project-progress-bar").style.width = `${associate.project.progress}%`;
    
    const projectDot = document.getElementById("p-project-status-dot");
    const projectStatusText = document.getElementById("p-project-status-text");
    if (associate.project.status === "Healthy") {
      projectDot.className = "w-2 h-2 rounded-full bg-[#15803d]";
      projectStatusText.className = "text-[10px] font-bold text-[#15803d]";
      projectStatusText.innerText = "Healthy";
    } else {
      projectDot.className = "w-2 h-2 rounded-full bg-[#f59e0b]";
      projectStatusText.className = "text-[10px] font-bold text-[#f59e0b]";
      projectStatusText.innerText = "At Risk";
    }
    
    // Update Evaluation Sliders
    const evalData = associate.currentEvaluation;
    document.getElementById("input-tech").value = evalData.tech;
    document.getElementById("val-tech").innerText = `${evalData.tech}/5`;
    
    document.getElementById("input-learn").value = evalData.learn;
    document.getElementById("val-learn").innerText = `${evalData.learn}/5`;
    
    document.getElementById("input-adapt").value = evalData.adapt;
    document.getElementById("val-adapt").innerText = `${evalData.adapt}/5`;
    
    document.getElementById("input-att").value = evalData.attitude;
    document.getElementById("val-att").innerText = `${evalData.attitude}/5`;
    
    document.getElementById("eval-comments").value = evalData.comments;
    
    // Update Live average
    updateLiveScores();
    
    // Update Probation Assessment Card
    updateProbationAssessment(associate);
    
    // Render Curves
    renderPerformanceCurves(associate);
    
  } catch (error) {
    console.error("Error selecting associate:", error);
  }
}

// Live feedback of average score on slider move
function updateLiveScores() {
  const tech = parseFloat(document.getElementById("input-tech").value);
  const learn = parseFloat(document.getElementById("input-learn").value);
  const adapt = parseFloat(document.getElementById("input-adapt").value);
  const attitude = parseFloat(document.getElementById("input-att").value);
  
  const avg = (tech + learn + adapt + attitude) / 4;
  document.getElementById("live-average-score").innerText = avg.toFixed(1);
  
  // Calculate month rating stars
  let stars = 1;
  if (avg >= 4.5) stars = 5;
  else if (avg >= 4.0) stars = 4;
  else if (avg >= 3.0) stars = 3;
  else if (avg >= 2.0) stars = 2;
  else stars = 1;

  const starContainer = document.getElementById("month-rating-stars");
  if (starContainer) {
    let starsHtml = '';
    for(let i = 0; i < 5; i++) {
        if(i < stars) {
            starsHtml += `<span class="material-symbols-outlined rating-star" style="font-variation-settings: 'FILL' 1">star</span>`;
        } else {
            starsHtml += `<span class="material-symbols-outlined rating-star rating-star-empty" style="font-variation-settings: 'FILL' 0">star</span>`;
        }
    }
    starContainer.innerHTML = starsHtml;
  }

  // Live update the Fit for Role status block
  const container = document.getElementById("fit-role-container");
  const iconBg = document.getElementById("fit-role-icon-bg");
  const statusText = document.getElementById("fit-role-status-text");
  const msgText = document.getElementById("fit-role-message-text");
  const icon = document.getElementById("fit-role-icon");
  
  if (avg >= 3.5) {
    container.className = "bg-[#f0fdf4] border border-[#15803d]/20 rounded-xl p-4 flex items-center gap-4 shadow-sm min-w-[240px]";
    iconBg.className = "w-10 h-10 bg-[#15803d] rounded-full flex items-center justify-center flex-shrink-0";
    icon.innerText = "check_circle";
    statusText.innerText = "Fit for Role";
    statusText.className = "text-md font-bold text-[#15803d] leading-none";
    msgText.innerText = "Highly recommended for current position";
    msgText.className = "text-xs text-[#15803d]/80 mt-1";
  } else if (avg >= 3.0) {
    container.className = "bg-[#fffbeb] border border-[#d97706]/20 rounded-xl p-4 flex items-center gap-4 shadow-sm min-w-[240px]";
    iconBg.className = "w-10 h-10 bg-[#d97706] rounded-full flex items-center justify-center flex-shrink-0";
    icon.innerText = "pending";
    statusText.innerText = "Marginal Fit";
    statusText.className = "text-md font-bold text-[#d97706] leading-none";
    msgText.innerText = "Requires close monitoring / coaching";
    msgText.className = "text-xs text-[#d97706]/80 mt-1";
  } else {
    container.className = "bg-[#fef2f2] border border-[#dc2626]/20 rounded-xl p-4 flex items-center gap-4 shadow-sm min-w-[240px]";
    iconBg.className = "w-10 h-10 bg-[#dc2626] rounded-full flex items-center justify-center flex-shrink-0";
    icon.innerText = "cancel";
    statusText.innerText = "Needs Support";
    statusText.className = "text-md font-bold text-[#dc2626] leading-none";
    msgText.innerText = "Action plan needed for performance improvement";
    msgText.className = "text-xs text-[#dc2626]/80 mt-1";
  }
}

// Update probation overall summary
function updateProbationAssessment(associate) {
  const currentAvg = calculateEvaluationAverage(associate.currentEvaluation);
  
  // Calculate average of history + current
  const allScores = [...associate.history.map(h => h.average || calculateEvaluationAverage(h)), currentAvg];
  const totalAvg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  
  document.getElementById("probation-avg-score").innerText = totalAvg.toFixed(1);
  
  // Trend indicator
  const trendBadge = document.getElementById("probation-trend");
  const trendVal = document.getElementById("trend-val");
  
  if (associate.history.length > 0) {
    const prevAvg = associate.history[associate.history.length - 1].average;
    const difference = currentAvg - prevAvg;
    
    if (difference >= 0) {
      trendBadge.className = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-[#15803d] dark:bg-green-950/50 ml-2";
      trendVal.innerText = `+${difference.toFixed(1)}`;
      trendBadge.querySelector('.material-symbols-outlined').innerText = "trending_up";
    } else {
      trendBadge.className = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-error dark:bg-red-950/50 ml-2";
      trendVal.innerText = `${difference.toFixed(1)}`;
      trendBadge.querySelector('.material-symbols-outlined').innerText = "trending_down";
    }
  } else {
    trendBadge.className = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-on-surface-variant dark:bg-gray-800 ml-2";
    trendVal.innerText = "First Eval";
    trendBadge.querySelector('.material-symbols-outlined').innerText = "check";
  }

  // Recommended status
  const fitStatusText = document.getElementById("probation-fit-status");
  if (totalAvg >= 4.0) {
    fitStatusText.innerText = "Strongly Recommended";
    fitStatusText.className = "text-lg font-bold text-[#15803d]";
  } else if (totalAvg >= 3.0) {
    fitStatusText.innerText = "Recommended";
    fitStatusText.className = "text-lg font-bold text-secondary";
  } else {
    fitStatusText.innerText = "Needs Improvement Plan";
    fitStatusText.className = "text-lg font-bold text-error";
  }
  

}

// Render dynamic SVGs for trend analysis
function renderPerformanceCurves(associate) {
  // Extract historical points + current evaluation point
  const points = [...associate.history];
  
  // Add current evaluation as the latest month
  const currentMonthName = associate.history.length === 0 ? "Month 1" : `Month ${associate.history.length + 1}`;
  const curTech = associate.currentEvaluation.tech;
  const curLearn = associate.currentEvaluation.learn;
  const curAdapt = associate.currentEvaluation.adapt;
  const curAttitude = associate.currentEvaluation.attitude;
  const curAvg = calculateEvaluationAverage(associate.currentEvaluation);
  
  points.push({
    month: currentMonthName,
    tech: curTech,
    learn: curLearn,
    adapt: curAdapt,
    attitude: curAttitude,
    average: curAvg
  });
  
  // Render sub charts
  drawTrendSvg("chart-tech", points, "tech", "var(--secondary)");
  drawTrendSvg("chart-learn", points, "learn", "#15803d");
  drawTrendSvg("chart-adapt", points, "adapt", "#f59e0b");
  drawTrendSvg("chart-attitude", points, "attitude", "var(--error)");
  
  // Render main chart
  drawTotalAvgSvg("chart-total", points);
  
  // Render AI Suggestions based on scores
  renderAiSuggestions(curTech, curLearn, curAdapt, curAttitude);
}

function calculateEvaluationAverage(evaluation) {
  const tech = parseFloat(evaluation.tech) || 0;
  const learn = parseFloat(evaluation.learn) || 0;
  const adapt = parseFloat(evaluation.adapt) || 0;
  const attitude = parseFloat(evaluation.attitude) || 0;
  return (tech + learn + adapt + attitude) / 4;
}

// Helper to draw small trend SVG
function drawTrendSvg(id, pointsData, key, strokeColor) {
  const svg = document.getElementById(id);
  if (!svg) return;
  svg.innerHTML = "";
  
  const width = 100;
  const height = 50;
  const paddingX = 15;
  const paddingY = 8;
  
  const values = pointsData.map(p => parseFloat(p[key]) || 0);
  const N = values.length;
  
  // Draw Background grid
  svg.innerHTML += `
    <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="var(--outline-variant)" stroke-width="0.5" stroke-dasharray="2 2" opacity="0.4" />
    <line x1="0" y1="${height - paddingY}" x2="${width}" y2="${height - paddingY}" stroke="var(--outline-variant)" stroke-width="0.5" opacity="0.3" />
  `;

  if (N === 1) {
    // Single evaluation point
    const cy = height - paddingY - ((values[0] - 1) / 4) * (height - 2 * paddingY);
    svg.innerHTML += `
      <circle cx="${width/2}" cy="${cy}" r="3" fill="${strokeColor}" stroke="var(--surface-container-lowest)" stroke-width="1" />
      <text x="${width/2}" y="${height - 2}" font-size="6" text-anchor="middle" fill="var(--on-surface-variant)">${pointsData[0].month}</text>
      <text x="${width/2}" y="${cy - 5}" font-size="6" text-anchor="middle" font-weight="700" fill="${strokeColor}">${values[0].toFixed(1)}</text>
    `;
    return;
  }
  
  // Calculate coordinates
  const points = values.map((val, idx) => {
    const x = paddingX + (idx / (N - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((val - 1) / 4) * (height - 2 * paddingY);
    return { x, y, val, month: pointsData[idx].month };
  });
  
  // Path building
  let pathStr = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < N; i++) {
    // Draw lines
    pathStr += ` L ${points[i].x} ${points[i].y}`;
  }
  
  // Draw path
  svg.innerHTML += `
    <path d="${pathStr}" fill="none" stroke="${strokeColor}" stroke-width="2.5" class="chart-line" stroke-linecap="round" stroke-linejoin="round" />
  `;
  
  // Draw point circles
  points.forEach((pt, idx) => {
    svg.innerHTML += `
      <circle cx="${pt.x}" cy="${pt.y}" r="2.5" fill="${strokeColor}" stroke="var(--surface-container-lowest)" stroke-width="1.2" class="chart-point" />
      <text x="${pt.x}" y="${pt.y - 5}" font-size="5.5" text-anchor="middle" font-weight="700" fill="${strokeColor}">${pt.val.toFixed(1)}</text>
    `;
  });

  points.forEach((pt, idx) => {
    if (idx === 0 || idx === points.length - 1) {
      svg.innerHTML += `<text x="${pt.x}" y="${height - 2}" font-size="5.5" text-anchor="middle" fill="var(--on-surface-variant)">${pt.month}</text>`;
    }
  });
}

// Helper to draw big monthly calculated average score as bars with a trend line
function drawTotalAvgSvg(id, pointsData) {
  const svg = document.getElementById(id);
  if (!svg) return;
  svg.innerHTML = "";
  
  const width = 200;
  const height = 100;
  const paddingX = 25;
  const paddingY = 15;
  
  const N = pointsData.length;
  const values = pointsData.map(p => p.average);
  
  // Setup SVG Defs for gradients
  svg.innerHTML += `
    <defs>
      <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--secondary)" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="var(--secondary)" stop-opacity="0.35"/>
      </linearGradient>
    </defs>
  `;
  
  // Y-axis grid lines
  for (let i = 1; i <= 5; i++) {
    const y = height - paddingY - ((i - 1) / 4) * (height - 2 * paddingY);
    svg.innerHTML += `
      <line x1="${paddingX - 5}" y1="${y}" x2="${width - 10}" y2="${y}" stroke="var(--outline-variant)" stroke-width="0.5" opacity="0.3" />
      <text x="${paddingX - 10}" y="${y + 2.5}" font-size="6" text-anchor="end" fill="var(--on-surface-variant)">${i}.0</text>
    `;
  }
  
  if (N === 1) {
    const cy = height - paddingY - ((values[0] - 1) / 4) * (height - 2 * paddingY);
    const barHeight = height - paddingY - cy;
    svg.innerHTML += `
      <rect x="${width/2 - 10}" y="${cy}" width="20" height="${barHeight}" rx="2" fill="url(#totalGrad)" />
      <circle cx="${width/2}" cy="${cy}" r="4" fill="var(--secondary)" stroke="var(--surface-container-lowest)" stroke-width="1.5" />
      <text x="${width/2}" y="${cy - 7}" font-size="8" text-anchor="middle" font-weight="700" fill="var(--secondary)">${values[0].toFixed(2)}</text>
      <text x="${width/2}" y="${height - 2}" font-size="7" text-anchor="middle" fill="var(--on-surface-variant)">${pointsData[0].month}</text>
    `;
    return;
  }
  
  // Calculate coords
  const coords = values.map((val, idx) => {
    const x = paddingX + (idx / (N - 1)) * (width - paddingX - 15);
    const y = height - paddingY - ((val - 1) / 4) * (height - 2 * paddingY);
    return { x, y, month: pointsData[idx].month, val };
  });
  
  // Draw monthly score bars
  const barWidth = Math.min(18, Math.max(8, (width - paddingX - 25) / N * 0.48));
  coords.forEach((coord) => {
    const barHeight = height - paddingY - coord.y;
    svg.innerHTML += `
      <rect x="${coord.x - barWidth / 2}" y="${coord.y}" width="${barWidth}" height="${barHeight}" rx="2" fill="url(#totalGrad)" opacity="0.9" />
    `;
  });

  // Draw path
  let pathStr = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < N; i++) {
    pathStr += ` L ${coords[i].x} ${coords[i].y}`;
  }
  
  svg.innerHTML += `
    <path d="${pathStr}" fill="none" stroke="var(--primary)" stroke-width="1.8" class="chart-line" stroke-linecap="round" stroke-linejoin="round" />
  `;
  
  // Draw dots and X-axis month tags
  coords.forEach((coord, idx) => {
    svg.innerHTML += `
      <circle cx="${coord.x}" cy="${coord.y}" r="3" fill="var(--secondary)" stroke="var(--surface-container-lowest)" stroke-width="1.5" class="chart-point" />
      <text x="${coord.x}" y="${coord.y - 6}" font-size="6.5" text-anchor="middle" font-weight="700" fill="var(--primary)">${coord.val.toFixed(2)}</text>
      <text x="${coord.x}" y="${height - 2}" font-size="6" text-anchor="middle" fill="var(--on-surface-variant)">${coord.month}</text>
    `;
  });
}

// Render dynamic AI recommendations
function renderAiSuggestions(tech, learn, adapt, attitude) {
  const container = document.getElementById("ai-suggestions-container");
  if (!container) return;
  container.innerHTML = "";
  
  const suggestions = [];
  
  if (tech < 4) {
    suggestions.push({
      icon: "terminal",
      title: "Technical Mentorship",
      desc: "Connect with a senior staff developer to address codebase patterns and advanced algorithms to push Technical score to 4.0."
    });
  }
  
  if (learn < 4) {
    suggestions.push({
      icon: "menu_book",
      title: "Self-Paced Learning",
      desc: "Assign selected library training modules and target learning milestones in the coming month."
    });
  } else {
    suggestions.push({
      icon: "auto_stories",
      title: "Knowledge Transfers",
      desc: "Capitalize on high learning efficiency by hosting a peer-level knowledge sharing session."
    });
  }
  
  if (adapt < 4) {
    suggestions.push({
      icon: "explore",
      title: "Cross-Functional Syncs",
      desc: "Involve in agile peer collaborations and daily scrums to foster system familiarity and adjustment."
    });
  }
  
  if (attitude >= 4) {
    suggestions.push({
      icon: "groups",
      title: "Buddy System",
      desc: "Leverage strong positive collaboration and attitude by assigning as a buddy for newer hires."
    });
  }

  // Display top 3
  suggestions.slice(0, 3).forEach(s => {
    container.innerHTML += `
      <div class="flex gap-4 fade-in">
        <div class="flex-shrink-0 w-8 h-8 rounded bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center text-secondary">
          <span class="material-symbols-outlined text-[20px]">${s.icon}</span>
        </div>
        <div>
          <p class="text-sm font-semibold text-primary">${s.title}</p>
          <p class="text-xs text-on-surface-variant mt-0.5">${s.desc}</p>
        </div>
      </div>
    `;
  });
}

// Save Evaluation API Handler
async function handleSaveEvaluation(e) {
  e.preventDefault();
  
  const tech = document.getElementById("input-tech").value;
  const learn = document.getElementById("input-learn").value;
  const adapt = document.getElementById("input-adapt").value;
  const attitude = document.getElementById("input-att").value;
  const comments = document.getElementById("eval-comments").value;
  
  try {
    const response = await fetch(`/api/associates/${activeAssociateId}/evaluations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tech, learn, adapt, attitude, comments })
    });
    
    if (!response.ok) throw new Error("Failed to save evaluation");
    
    const updatedAssociate = await response.json();
    addNotification(`Evaluation saved for ${updatedAssociate.name}!`, "success");

    const index = associates.findIndex(a => a.id === updatedAssociate.id);
    if (index !== -1) associates[index] = updatedAssociate;
    selectAssociate(updatedAssociate.id);
    renderTeamGrid();
    renderEvaluationLog();
    renderReports();
  } catch (error) {
    console.error("Save evaluation error:", error);
    addNotification("Could not save evaluation. Please try again.", "error");
  }
}

// Render team tab cards
function renderTeamGrid() {
  const container = document.getElementById("team-grid");
  if (!container) return;
  container.innerHTML = "";
  
  document.getElementById("team-count").innerText = `${associates.length} Associate${associates.length !== 1 ? 's' : ''}`;
  
  associates.forEach(associate => {
    const curAvg = calculateEvaluationAverage(associate.currentEvaluation);
    const historyAvg = associate.history.length > 0
      ? associate.history.reduce((sum, h) => sum + h.average, 0) / associate.history.length
      : curAvg;
      
    const overallAvg = (curAvg + historyAvg) / 2;
    const statusDotColor = associate.status === "On Track" ? "bg-[#15803d]" : "bg-error";
    
    container.innerHTML += `
      <div class="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-between hover-card-lift fade-in">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <img class="w-12 h-12 rounded-full object-cover border border-outline-variant" src="${associate.avatar}" alt="${associate.name}">
              <div>
                <h4 class="font-bold text-primary text-sm">${associate.name}</h4>
                <p class="text-xs text-on-surface-variant">${associate.employeeId}</p>
              </div>
            </div>
            <span class="inline-flex px-2 py-0.5 rounded text-xs font-bold ${associate.status === "On Track" ? 'bg-green-100 text-[#15803d] dark:bg-green-950/30' : 'bg-red-100 text-error dark:bg-red-950/30'}">
              ${associate.status}
            </span>
          </div>
          <div class="space-y-2 mb-6 text-xs text-on-surface-variant">
            <div class="flex justify-between">
              <span>Manager:</span>
              <span class="font-semibold text-primary">${associate.manager}</span>
            </div>
            <div class="flex justify-between">
              <span>Probation Period:</span>
              <span class="font-semibold text-primary">${associate.probation}</span>
            </div>
            <div class="flex justify-between">
              <span>Project:</span>
              <span class="font-semibold text-primary truncate max-w-[160px]">${associate.project.name}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-outline-variant/30 mt-2">
              <span>Avg Score:</span>
              <span class="font-bold text-sm text-secondary">${overallAvg.toFixed(1)}/5.0</span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="reviewFromTeamGrid('${associate.id}')" class="flex-1 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant text-primary font-semibold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[16px]">rate_review</span>
            Review Dashboard
          </button>
          <button onclick="deleteAssociate('${associate.id}')" class="border border-outline-variant hover:border-error hover:bg-error-container text-on-surface-variant hover:text-white p-2 rounded-lg transition-all flex items-center justify-center">
            <span class="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
    `;
  });
}

function reviewFromTeamGrid(id) {
  switchTab('dashboard');
  selectAssociate(id);
}

// Delete Associate API Handler
async function deleteAssociate(id) {
  if (!confirm("Are you sure you want to delete this associate record? This cannot be undone.")) return;
  
  try {
    const response = await fetch(`/api/associates/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error("Delete failed");
    
    addNotification("Associate record removed", "info");
    fetchAssociates();
  } catch (error) {
    console.error("Delete associate error:", error);
    addNotification("Could not delete record.", "error");
  }
}

// Render evaluations logs table
function renderEvaluationLog() {
  const tbody = document.getElementById("eval-log-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  let count = 0;
  associates.forEach(associate => {
    // Current
    const curAvg = (associate.currentEvaluation.tech + associate.currentEvaluation.learn + associate.currentEvaluation.adapt + associate.currentEvaluation.attitude) / 4;
    tbody.innerHTML += `
      <tr class="hover:bg-surface-container/30 transition-colors text-xs text-on-surface border-b border-outline-variant/50">
        <td class="p-4 flex items-center gap-2">
          <img class="w-6 h-6 rounded-full object-cover" src="${associate.avatar}">
          <span class="font-bold">${associate.name}</span>
        </td>
        <td class="p-4 font-semibold">Current Month</td>
        <td class="p-4">${associate.currentEvaluation.tech}/5</td>
        <td class="p-4">${associate.currentEvaluation.learn}/5</td>
        <td class="p-4">${associate.currentEvaluation.adapt}/5</td>
        <td class="p-4">${associate.currentEvaluation.attitude}/5</td>
        <td class="p-4 font-bold text-secondary">${curAvg.toFixed(2)}</td>
        <td class="p-4 max-w-xs truncate italic text-on-surface-variant" title="${associate.currentEvaluation.comments || 'No comment'}">
          ${associate.currentEvaluation.comments || '-'}
        </td>
      </tr>
    `;
    count++;
    
    // History
    associate.history.forEach(hist => {
      tbody.innerHTML += `
        <tr class="hover:bg-surface-container/30 transition-colors text-xs text-on-surface border-b border-outline-variant/50">
          <td class="p-4 flex items-center gap-2">
            <img class="w-6 h-6 rounded-full object-cover opacity-60" src="${associate.avatar}">
            <span class="text-on-surface-variant">${associate.name}</span>
          </td>
          <td class="p-4 text-on-surface-variant">${hist.month}</td>
          <td class="p-4 text-on-surface-variant">${hist.tech}/5</td>
          <td class="p-4 text-on-surface-variant">${hist.learn}/5</td>
          <td class="p-4 text-on-surface-variant">${hist.adapt}/5</td>
          <td class="p-4 text-on-surface-variant">${hist.attitude}/5</td>
          <td class="p-4 font-bold text-on-surface-variant">${hist.average.toFixed(2)}</td>
          <td class="p-4 max-w-xs truncate italic text-on-surface-variant" title="${hist.comments || 'No comment'}">
            ${hist.comments || '-'}
          </td>
        </tr>
      `;
      count++;
    });
  });
  
  if (count === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-8 text-center text-on-surface-variant italic">No evaluation records log found.</td>
      </tr>
    `;
  }
}

// Search filter for evaluations
function filterEvaluationLog() {
  const query = document.getElementById("eval-search").value.toLowerCase();
  const rows = document.querySelectorAll("#eval-log-table-body tr");
  
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    if (text.includes(query)) {
      row.classList.remove("hidden");
    } else {
      row.classList.add("hidden");
    }
  });
}

// Render charts in Reports tab
function renderReports() {
  // 1. Status Donut chart ratios
  const onTrackCount = associates.filter(a => a.status === "On Track").length;
  const needsImprovementCount = associates.filter(a => a.status === "Needs Improvement").length;
  const total = associates.length;
  
  document.getElementById("report-total-employees").innerText = total;
  document.getElementById("donut-val-track").innerText = onTrackCount;
  document.getElementById("donut-val-needs").innerText = needsImprovementCount;
  
  const donutTrack = document.getElementById("report-donut-track");
  const donutNeeds = document.getElementById("report-donut-needs");
  
  if (total > 0 && donutTrack && donutNeeds) {
    const trackPct = (onTrackCount / total) * 100;
    const needsPct = (needsImprovementCount / total) * 100;
    
    donutTrack.setAttribute("stroke-dasharray", `${trackPct} 100`);
    donutTrack.setAttribute("stroke-dashoffset", "25"); // start top
    
    donutNeeds.setAttribute("stroke-dasharray", `${needsPct} 100`);
    donutNeeds.setAttribute("stroke-dashoffset", `${25 - trackPct}`);
  }
  
  // 2. Average scores by Manager Bar Charts
  const barContainer = document.getElementById("manager-report-bars");
  if (!barContainer) return;
  barContainer.innerHTML = "";
  
  // Compute group scores
  const managerMap = {};
  associates.forEach(a => {
    const currentAvg = (a.currentEvaluation.tech + a.currentEvaluation.learn + a.currentEvaluation.adapt + a.currentEvaluation.attitude) / 4;
    if (!managerMap[a.manager]) {
      managerMap[a.manager] = [];
    }
    managerMap[a.manager].push(currentAvg);
  });
  
  Object.keys(managerMap).forEach(manager => {
    const scores = managerMap[manager];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const pct = (avg / 5) * 100;
    
    barContainer.innerHTML += `
      <div class="space-y-1 fade-in">
        <div class="flex justify-between text-xs font-semibold">
          <span class="text-primary">${manager}</span>
          <span class="text-secondary font-bold">${avg.toFixed(2)}/5.0</span>
        </div>
        <div class="w-full bg-surface-container-high rounded-full h-3 overflow-hidden">
          <div class="bg-secondary h-3 rounded-full transition-all duration-700" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  });
}

// Reset Database API Handler
async function resetDatabase() {
  if (!confirm("Are you sure you want to restore all defaults? This wipes any changes you made.")) return;
  
  try {
    const response = await fetch('/api/reset', { method: 'POST' });
    if (!response.ok) throw new Error("Reset failed");
    
    addNotification("Database restored to mock defaults", "info");
    fetchAssociates();
    if (activeTab !== "dashboard") {
      switchTab("dashboard");
    }
  } catch (error) {
    console.error("Database reset error:", error);
    addNotification("Could not reset database.", "error");
  }
}

// Tab Switching System
function switchTab(tabName) {
  activeTab = tabName;
  
  // Hide all panels
  document.getElementById("tab-content-dashboard").classList.add("hidden");
  document.getElementById("tab-content-team").classList.add("hidden");
  document.getElementById("tab-content-evaluations").classList.add("hidden");
  document.getElementById("tab-content-reports").classList.add("hidden");
  document.getElementById("tab-content-help").classList.add("hidden");
  document.getElementById("tab-content-settings").classList.add("hidden");
  
  // Show active panel
  document.getElementById(`tab-content-${tabName}`).classList.remove("hidden");
  
  // Toggle Right sidebar (Dashboard profile)
  const profileCard = document.getElementById("profile-card");
  if (tabName === "dashboard") {
    profileCard.classList.remove("hidden");
  } else {
    profileCard.classList.add("hidden");
  }
  
  // Style top nav links
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.className = "nav-tab text-on-surface-variant hover:text-secondary transition-colors duration-150 text-sm pb-1 focus:outline-none";
  });
  
  const activeNav = document.getElementById(`nav-${tabName}`);
  if (activeNav) {
    activeNav.className = "nav-tab text-secondary border-b-2 border-secondary font-bold pb-1 text-sm transition-all focus:outline-none";
  }
  
  // Trigger specific re-renders
  if (tabName === "team") renderTeamGrid();
  if (tabName === "evaluations") renderEvaluationLog();
  if (tabName === "reports") renderReports();
  
  // Close sidebar overlay on mobile on tap
  toggleSidebar(true);
}

// Sidebar Drawer toggling
function toggleSidebar(forceClose = false) {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (!sidebar || !overlay) return;
  
  if (forceClose || !sidebar.classList.contains("-translate-x-full")) {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  } else {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
  }
}

// FAQ Collapse/Expand
function toggleFaq(header) {
  const p = header.nextElementSibling;
  const icon = header.querySelector('.material-symbols-outlined');
  
  if (p.classList.contains("hidden")) {
    p.classList.remove("hidden");
    icon.innerText = "expand_less";
  } else {
    p.classList.add("hidden");
    icon.innerText = "expand_more";
  }
}

function filterFaqs() {
  const query = document.getElementById("faq-search").value.toLowerCase();
  const items = document.querySelectorAll(".faq-item");
  
  items.forEach(item => {
    const text = item.innerText.toLowerCase();
    if (text.includes(query)) {
      item.classList.remove("hidden");
    } else {
      item.classList.add("hidden");
    }
  });
}

// Modal management
function openNewAssociateModal() {
  document.getElementById("new-associate-modal").classList.remove("hidden");
  document.getElementById("new-name").focus();
}

function closeNewAssociateModal() {
  document.getElementById("new-associate-modal").classList.add("hidden");
  document.getElementById("new-associate-form").reset();
}

// Submit New Associate API
async function submitNewAssociate(e) {
  e.preventDefault();
  
  const name = document.getElementById("new-name").value;
  const employeeId = document.getElementById("new-empid").value;
  const joinDate = document.getElementById("new-joindate").value;
  const manager = document.getElementById("new-manager").value;
  const probation = document.getElementById("new-probation").value;
  const avatar = document.getElementById("new-avatar").value;
  
  // Project
  const projName = document.getElementById("new-proj-name").value;
  const projPhase = document.getElementById("new-proj-phase").value;
  const projProgress = document.getElementById("new-proj-progress").value;
  const projStatus = document.getElementById("new-proj-status").value;
  
  const project = {
    name: projName || "New Task",
    phase: projPhase || "Onboarding",
    progress: parseInt(projProgress) || 0,
    status: projStatus || "Healthy"
  };

  try {
    const response = await fetch('/api/associates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, employeeId, joinDate, manager, probation, avatar, project })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to create associate");
    }
    
    const newAssoc = await response.json();
    addNotification(`Added associate ${newAssoc.name}!`, "success");
    
    closeNewAssociateModal();
    activeAssociateId = newAssoc.id;
    fetchAssociates();
    
    if (activeTab !== "dashboard") {
      switchTab("dashboard");
    }
  } catch (error) {
    console.error("Create associate error:", error);
    alert(error.message);
  }
}

// Notifications management
function loadMockNotifications() {
  notifications = [
    { id: 1, text: "Sarah Chen completed Month 2 evaluation.", time: "2 hours ago", type: "success" },
    { id: 2, text: "Marcus Thorne is flagged as 'Needs Improvement'.", time: "1 day ago", type: "warning" },
    { id: 3, text: "Elena Rodriguez evaluation is due in 3 days.", time: "2 days ago", type: "info" }
  ];
  renderNotifications();
}

function renderNotifications() {
  const list = document.getElementById("notif-list");
  const badge = document.getElementById("notif-badge");
  if (!list) return;
  
  list.innerHTML = "";
  
  if (notifications.length === 0) {
    list.innerHTML = `<div class="p-4 text-center text-xs text-on-surface-variant italic">No new notifications.</div>`;
    if (badge) badge.classList.add("hidden");
    return;
  }
  
  if (badge) badge.classList.remove("hidden");
  
  notifications.forEach(n => {
    let icon = "info";
    let iconClass = "text-secondary";
    if (n.type === "success") { icon = "check_circle"; iconClass = "text-green-600"; }
    if (n.type === "warning") { icon = "warning"; iconClass = "text-[#f59e0b]"; }
    
    list.innerHTML += `
      <div class="p-3 flex items-start gap-2 hover:bg-surface-container transition-colors">
        <span class="material-symbols-outlined text-[16px] mt-0.5 ${iconClass}">${icon}</span>
        <div class="flex-1">
          <p class="text-xs font-semibold text-primary leading-tight">${n.text}</p>
          <span class="text-[10px] text-on-surface-variant">${n.time}</span>
        </div>
      </div>
    `;
  });
}

function addNotification(text, type = "info") {
  notifications.unshift({
    id: Date.now(),
    text,
    time: "Just now",
    type
  });
  renderNotifications();
  
  // Custom temporary floating toast
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-2xl glass-panel border border-white/10 transition-all duration-300 transform translate-y-10 opacity-0`;
  
  let icon = "info";
  if (type === "success") icon = "check_circle";
  if (type === "error") icon = "error";
  
  toast.innerHTML = `
    <span class="material-symbols-outlined text-secondary">${icon}</span>
    <span>${text}</span>
  `;
  document.body.appendChild(toast);
  
  // Animate slide-up
  setTimeout(() => {
    toast.classList.remove("translate-y-10", "opacity-0");
  }, 10);
  
  // Fadeout after 3.5s
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

function clearNotifications() {
  notifications = [];
  renderNotifications();
}

function toggleNotifications() {
  const d = document.getElementById("notifications-dropdown");
  if (d) d.classList.toggle("hidden");
}

// Close notifications dropdown on click outside
window.addEventListener("click", (e) => {
  const dropdown = document.getElementById("notifications-dropdown");
  const btn = document.querySelector('[data-icon="notifications"]');
  if (dropdown && !dropdown.classList.contains("hidden") && !dropdown.contains(e.target) && !btn.contains(e.target)) {
    dropdown.classList.add("hidden");
  }
});

// Theme toggler
function setTheme(theme) {
  const html = document.documentElement;
  const btnLight = document.getElementById("theme-btn-light");
  const btnDark = document.getElementById("theme-btn-dark");
  
  if (theme === "dark") {
    html.classList.remove("light");
    html.classList.add("dark");
    if (btnDark) btnDark.className = "px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1 focus:outline-none transition-all bg-secondary text-white";
    if (btnLight) btnLight.className = "px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1 focus:outline-none transition-all text-on-surface-variant hover:bg-surface-container-high";
  } else {
    html.classList.remove("dark");
    html.classList.add("light");
    if (btnLight) btnLight.className = "px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1 focus:outline-none transition-all bg-secondary text-white";
    if (btnDark) btnDark.className = "px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1 focus:outline-none transition-all text-on-surface-variant hover:bg-surface-container-high";
  }
  localStorage.setItem("hrms_theme", theme);
}

// Quick action buttons
function triggerQuickAction(actionType) {
  const name = document.getElementById("p-name").innerText;
  const employeeId = document.getElementById("p-id")?.innerText || "";
  const email = `${name.toLowerCase().replace(/[^a-z]/g, '.').replace(/\.+/g, '.').replace(/^\./, '').replace(/\.$/, '')}@sundew.com`;
  
  if (actionType === "message") {
    addNotification(`Messaging interface opened for ${name}`, "success");
    alert(`Mock messaging chat window initialized for ${name}.\n(RM ID: ${currentUser.name})`);
  } else if (actionType === "email") {
    const score = document.getElementById("probation-avg-score")?.innerText || "";
    const subject = encodeURIComponent(`Probation feedback for ${name}`);
    const body = encodeURIComponent(`Hi ${name},\n\nI would like to share feedback regarding your current probation period.\n\nEmployee ID: ${employeeId}\nAverage performance score: ${score}/5.0\n\nRegards,\n${currentUser?.name || "HR Manager"}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    addNotification(`Email composer launched for ${name}`, "success");
  }
}
