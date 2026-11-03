import os
import json

def generate_selenium_cases():
    cases = []
    
    # 1. HOME PAGE - 50 cases (SEL-0001 to SEL-0050)
    home_subcategories = [
        ("Page Loading & Performance", "Verify homepage loads under 2 seconds and DOM ready state is complete", "Open http://localhost:5173", "Homepage loads without console errors within 2s", "High"),
        ("Logo & Branding", "Verify logo image renders correctly with alt text 'BioPatch AI' and links to root", "Inspect header logo element", "Logo image is visible and clickable", "Medium"),
        ("Navigation Bar", "Verify navigation links (Home, Simulations, Drug Library, Polymers, Contact) exist", "Inspect top navigation header", "All 5 nav items render and respond to hover", "High"),
        ("Hero Section Buttons", "Verify 'Explore System' primary call-to-action button triggers overview modal", "Click 'Explore System' button", "Overview modal opens with smooth animation", "High"),
        ("Footer Render", "Verify footer displays copyright, version 1.0.0, and privacy terms links", "Scroll to bottom of homepage", "Footer renders with all standard links", "Low"),
        ("Login Header Button", "Verify 'Login / Portal' button redirects user to authentication screen", "Click 'Login' button in header", "URL changes to /login", "High"),
        ("Responsive Layout", "Verify home layout stacks elements vertically on mobile screen width 375px", "Set viewport width to 375px", "Hamburger menu appears and grid collapses", "Medium"),
        ("Invalid Navigation", "Verify accessing non-existent route /invalid-page shows custom 404 page", "Navigate to http://localhost:5173/invalid-page", "404 page displayed with button to return home", "Medium"),
        ("Page Metadata", "Verify document title contains 'BioPatch AI - Pre-clinical Drug Release'", "Check document.title", "Title matches expected string", "Low"),
        ("Theme & Dark Mode", "Verify theme toggle switches body background color between light and dark", "Click theme toggle button", "CSS theme class updates instantly", "Low")
    ]
    
    for i in range(1, 51):
        sub_idx = (i - 1) % len(home_subcategories)
        var_num = (i - 1) // len(home_subcategories) + 1
        sub = home_subcategories[sub_idx]
        cases.append({
            "test_id": f"SEL-{i:04d}",
            "test_type": "UI / Functional",
            "module": "Home Page",
            "description": f"Home Page Case {i:02d}: {sub[0]} - Variant {var_num}",
            "precondition": "Web app is running at http://localhost:5173",
            "input": f"{sub[2]} (Variant {var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "Selenium WebDriver"
        })
        
    # 2. LOGIN / AUTHENTICATION - 100 cases (SEL-0051 to SEL-0150)
    login_subcategories = [
        ("Valid Login Researcher", "Verify valid researcher authentication with valid email and password", "email='researcher@biopatch.ai', password='Password123!'", "User redirected to /dashboard with JWT token saved", "Critical"),
        ("Valid Login Admin", "Verify valid admin authentication with admin credentials", "email='admin@biopatch.ai', password='AdminPassword123!'", "User redirected to /dashboard with admin capabilities", "Critical"),
        ("Invalid Password", "Verify error message when entering wrong password for registered email", "email='researcher@biopatch.ai', password='WrongPassword'", "Error message 'Invalid email or password' displayed", "High"),
        ("Unregistered Email", "Verify error message when attempting login with non-existent user email", "email='unknown_user@biopatch.ai', password='Password123!'", "Error message 'Invalid email or password' displayed", "High"),
        ("Empty Email Field", "Verify validation alert when submitting form with empty email field", "email='', password='Password123!'", "Form prevents submission, highlights email field", "Medium"),
        ("Empty Password Field", "Verify validation alert when submitting form with empty password field", "email='researcher@biopatch.ai', password=''", "Form prevents submission, highlights password field", "Medium"),
        ("Invalid Email Format", "Verify error handling when entering email missing domain or '@' sign", "email='invalid_email_format', password='Password123!'", "Inline error 'Enter a valid email address'", "Medium"),
        ("Password Visibility Toggle", "Verify clicking eye icon toggles password field between dots and plain text", "Type password, click eye icon toggle", "Input attribute changes from 'password' to 'text'", "Low"),
        ("Login Button Loading State", "Verify login button displays spinner and disables during HTTP request", "Click 'Login' button", "Button shows loading spinner and is disabled", "Medium"),
        ("Logout Functionality", "Verify clicking logout clears JWT token from storage and returns to /login", "Click 'Logout' in profile menu", "Token removed, redirected to /login", "High")
    ]
    
    for i in range(51, 151):
        sub_idx = (i - 51) % len(login_subcategories)
        var_num = (i - 51) // len(login_subcategories) + 1
        sub = login_subcategories[sub_idx]
        cases.append({
            "test_id": f"SEL-{i:04d}",
            "test_type": "Authentication",
            "module": "Login/Authentication",
            "description": f"Login Case {i - 50:03d}: {sub[0]} - Test Scenario {var_num}",
            "precondition": "User is on the login page http://localhost:5173/login",
            "input": f"{sub[2]} (Variant #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "Selenium WebDriver"
        })

    # 3. DASHBOARD - 75 cases (SEL-0151 to SEL-0225)
    dashboard_subcategories = [
        ("Dashboard Initial Render", "Verify dashboard renders 4 core metric cards (Total Simulations, Models, Accuracy, Recent)", "Navigate to /dashboard with active auth session", "All 4 summary cards render with numbers", "High"),
        ("Sidebar Navigation", "Verify clicking sidebar menu items highlights active menu item correctly", "Click sidebar items (Simulations, Libraries, Settings)", "Active route and highlighting update", "Medium"),
        ("Recent Activity Table", "Verify recent activity list displays simulation IDs, dates, and status tags", "Inspect activity table widget", "Table displays latest 5 simulation records", "Medium"),
        ("New Simulation CTA", "Verify clicking 'New Simulation' button opens prediction configuration form", "Click 'New Simulation' button", "Form drawer / view opens", "High"),
        ("Graph Visualization", "Verify canvas element for dissolution release curve chart renders smoothly", "Check chart component container", "Recharts canvas/SVG renders graph curves", "High"),
        ("Filter by Drug Type", "Verify filtering dashboard results by Drug dropdown updates visible statistics", "Select drug filter 'Metformin'", "Dashboard stats filter to Metformin simulations", "Medium"),
        ("Dashboard Refresh", "Verify clicking refresh button re-fetches latest stats from backend API", "Click dashboard refresh button", "API call triggered, data updated without page reload", "Low"),
        ("Export Dashboard Report", "Verify export CSV/PDF button downloads dashboard analytical report", "Click 'Export Report'", "File download initiates successfully", "Low")
    ]

    for i in range(151, 226):
        sub_idx = (i - 151) % len(dashboard_subcategories)
        var_num = (i - 151) // len(dashboard_subcategories) + 1
        sub = dashboard_subcategories[sub_idx]
        cases.append({
            "test_id": f"SEL-{i:04d}",
            "test_type": "Dashboard UI",
            "module": "Dashboard",
            "description": f"Dashboard Case {i - 150:02d}: {sub[0]} - Config Scenario {var_num}",
            "precondition": "Authenticated user on /dashboard",
            "input": f"{sub[2]} (Variant #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "Selenium WebDriver"
        })

    # 4. INPUT VALIDATION - 125 cases (SEL-0226 to SEL-0350)
    params = ["Drug", "Polymer", "pH", "Temperature", "Moisture", "Duration", "Drug Loading", "Polymer Concentration", "Patch Thickness"]
    validation_types = [
        ("Valid Standard Input", "pH=7.4, Temp=37, Moisture=50, Loading=10, Polymer Conc=5, Thickness=1.0, Duration=24", "Valid prediction accepted", "High"),
        ("Zero Value Validation", "pH=0, Temp=37, Moisture=0, Loading=0, Polymer Conc=0, Thickness=0, Duration=0", "Zero fields show validation warning if prohibited", "High"),
        ("Negative Value Input", "pH=-2.5, Temp=-10, Moisture=-15, Loading=-5, Polymer Conc=-2, Thickness=-0.5, Duration=-12", "Input rejected with error 'Value must be positive'", "High"),
        ("Upper Boundary Max", "pH=14.0, Temp=60.0, Moisture=100.0, Loading=50.0, Polymer Conc=30.0, Thickness=5.0, Duration=720.0", "Boundary maximum values accepted", "Medium"),
        ("Lower Boundary Min", "pH=0.1, Temp=10.0, Moisture=0.1, Loading=0.1, Polymer Conc=0.1, Thickness=0.1, Duration=0.1", "Boundary minimum values accepted", "Medium"),
        ("Decimal Precision Test", "pH=7.412, Temp=37.55, Moisture=45.89, Loading=10.123, Polymer Conc=5.67, Thickness=1.234, Duration=24.5", "Decimals formatted to 2 decimal places", "Medium"),
        ("Text In Numeric Field", "pH='abc', Temp='hot', Moisture='high', Loading='none', Polymer Conc='thick', Thickness='thin'", "Field prevents non-numeric text entry", "High"),
        ("Special Characters Input", "pH='@#$%', Temp='<script>', Moisture='100%', Loading='10mg', Polymer Conc='5&', Thickness='1.0*'", "Special characters sanitized/rejected", "High"),
        ("Very Large Value Input", "pH=99999, Temp=88888, Moisture=77777, Loading=66666, Polymer Conc=55555, Thickness=44444", "Value exceeds allowed range error", "Medium"),
        ("Missing Mandatory Parameter", "Leave one required parameter field blank", "Form submit disabled or error prompt shown", "High")
    ]
    
    for i in range(226, 351):
        val_idx = (i - 226) % len(validation_types)
        param_idx = ((i - 226) // len(validation_types)) % len(params)
        var_num = (i - 226) + 1
        param_name = params[param_idx]
        val_sub = validation_types[val_idx]
        cases.append({
            "test_id": f"SEL-{i:04d}",
            "test_type": "Input Validation",
            "module": "Input Validation",
            "description": f"Input Val Case {i - 225:03d}: {val_sub[0]} on '{param_name}' parameter (Case #{var_num})",
            "precondition": "User is on BioPatch AI prediction form",
            "input": f"Parameter: {param_name} | Value: {val_sub[1]} (Test #{var_num})",
            "expected_result": f"{val_sub[2]} for parameter {param_name}",
            "priority": val_sub[3],
            "automation_framework": "Selenium WebDriver"
        })

    # 5. PREDICTION / RESULTS - 100 cases (SEL-0351 to SEL-0450)
    pred_subcategories = [
        ("Prediction Run Metformin-PLA", "Run simulation with Metformin drug and PLA polymer matrix", "Metformin, PLA, pH 7.4, Temp 37C, Loading 10%", "Predicted release curve generated with score > 80", "Critical"),
        ("Prediction Run Paracetamol-Alginate", "Run simulation with Paracetamol drug and Alginate hydrogel", "Paracetamol, Alginate, pH 6.8, Temp 37C, Loading 15%", "Hydrogel release model calculated with peak rate", "Critical"),
        ("Prediction Run Losartan-Chitosan", "Run simulation with Losartan drug and Chitosan hydrogel", "Losartan, Chitosan, pH 4.0, Temp 37C, Loading 5%", "pH-sensitive burst release curve rendered", "High"),
        ("Prediction Run Ibuprofen-Gelatin", "Run simulation with Ibuprofen drug and Gelatin matrix", "Ibuprofen, Gelatin, pH 7.4, Temp 37C, Loading 20%", "Erodible matrix prediction result summary shown", "High"),
        ("Prediction Graph Hover Tooltip", "Verify hovering over release curve points shows time and cumulative release %", "Hover cursor over point t=12h on chart", "Tooltip popup displays '12 hours: 68.4% release'", "Medium"),
        ("Prediction Risk Score Indicator", "Verify risk level badge displays (Low, Moderate, High Risk)", "Inspect Risk Score widget", "Risk score badge rendered with appropriate color code", "High"),
        ("Result Table Time Points", "Verify release table lists time steps (0h, 2h, 4h, 8h, 12h, 24h, 48h)", "Check prediction data table", "All standard time points present in table", "Medium"),
        ("Prediction Form Reset", "Verify clicking Reset clears all form inputs and hides prediction result panel", "Click 'Reset Form' button", "Form returns to default blank values, result hidden", "Medium"),
        ("Prediction Export Report", "Verify downloading simulation report creates PDF with chart and summary", "Click 'Download Report'", "PDF document generated with simulation details", "High"),
        ("Sequential Predictions History", "Verify running 3 consecutive predictions appends all 3 to history tab", "Execute 3 distinct predictions", "History table shows 3 new simulation entries", "Medium")
    ]

    for i in range(351, 451):
        sub_idx = (i - 351) % len(pred_subcategories)
        var_num = (i - 351) // len(pred_subcategories) + 1
        sub = pred_subcategories[sub_idx]
        cases.append({
            "test_id": f"SEL-{i:04d}",
            "test_type": "Prediction Logic",
            "module": "Prediction/Results",
            "description": f"Prediction Case {i - 350:03d}: {sub[0]} - Run #{var_num}",
            "precondition": "Authenticated user on simulation screen",
            "input": f"{sub[2]} (Run Variation #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "Selenium WebDriver"
        })

    # 6. UI / COMPATIBILITY - 50 cases (SEL-0451 to SEL-0500)
    viewports = [
        ("Desktop 4K 2560x1440", "2560x1440", "Chrome", "Full desktop multi-column layout without overflow", "High"),
        ("Desktop FHD 1920x1080", "1920x1080", "Chrome", "Standard 1080p full screen layout rendering", "High"),
        ("Laptop HD 1366x768", "1366x768", "Edge", "Compact laptop layout with scrollbars as needed", "Medium"),
        ("Tablet Landscape 1024x768", "1024x768", "Firefox", "2-column tablet layout with visible sidebar", "Medium"),
        ("Tablet Portrait 768x1024", "768x1024", "Chrome Mobile", "1-column tablet layout with drawer menu", "Medium"),
        ("Mobile Large 414x896", "414x896", "Chrome Mobile", "Mobile layout with floating action button", "High"),
        ("Mobile Small 375x667", "375x667", "Edge Mobile", "Mobile layout without horizontal overflow", "High"),
        ("Firefox Browser Desktop", "1920x1080", "Firefox", "Gecko engine CSS flexbox and grid rendering", "Medium"),
        ("Edge Chromium Desktop", "1920x1080", "Edge", "Chromium rendering alignment check", "Low"),
        ("Safari Webkit Emulation", "1920x1080", "Safari", "Webkit engine gradient and chart rendering", "Low")
    ]

    for i in range(451, 501):
        sub_idx = (i - 451) % len(viewports)
        var_num = (i - 451) // len(viewports) + 1
        sub = viewports[sub_idx]
        cases.append({
            "test_id": f"SEL-{i:04d}",
            "test_type": "UI / Compatibility",
            "module": "UI/Compatibility",
            "description": f"Compatibility Case {i - 450:02d}: {sub[0]} (Run #{var_num})",
            "precondition": "Web app running",
            "input": f"Resolution: {sub[1]} | Browser: {sub[2]} (Test #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "Selenium WebDriver"
        })

    return cases


def generate_appium_cases():
    cases = []
    
    # 1. APP LAUNCH - 30 cases (APP-0001 to APP-0030)
    launch_subs = [
        ("Cold Start Launch", "Verify Android app cold boot loads main splash activity under 2.5s", "Launch package com.biopatch.mobile", "Splash screen renders, transitions to login", "Critical"),
        ("Splash Screen Branding", "Verify splash screen displays BioPatch logo and loading indicator", "Cold launch app", "Logo and animated loader visible", "High"),
        ("Permission Request Dialog", "Verify app prompts for internet and notification permissions on first launch", "First app installation startup", "Permission dialog appears with Allow/Deny", "High"),
        ("App Resume from Background", "Verify app resumes instantly when switching back from home launcher", "Press Home button, reopen app", "App resumes previous screen without state loss", "Medium"),
        ("App Force Stop & Restart", "Verify app recovers cleanly after force stop from Android app settings", "Force stop package, launch app", "App launches cleanly into login/home screen", "Medium")
    ]
    for i in range(1, 31):
        sub_idx = (i - 1) % len(launch_subs)
        var_num = (i - 1) // len(launch_subs) + 1
        sub = launch_subs[sub_idx]
        cases.append({
            "test_id": f"APP-{i:04d}",
            "test_type": "Mobile App Lifecycle",
            "module": "App Launch",
            "description": f"App Launch Case {i:02d}: {sub[0]} - Variation #{var_num}",
            "precondition": "Android emulator / device connected via ADB",
            "input": f"{sub[2]} (Scenario #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "Appium Flutter Driver"
        })

    # 2. LOGIN - 60 cases (APP-0031 to APP-0090)
    login_subs = [
        ("Mobile Valid Login", "Verify valid authentication on Android device via Flutter text fields", "Email='researcher@biopatch.ai', Password='Password123!'", "User authenticated, navigated to Mobile Dashboard", "Critical"),
        ("Mobile Invalid Password", "Verify mobile error dialog when entering invalid password on device", "Email='researcher@biopatch.ai', Password='Wrong'", "Android snackbar/dialog 'Authentication failed'", "High"),
        ("Mobile Empty Input Validation", "Verify login button remains disabled or shows error when fields are empty", "Email='', Password=''", "Validation text under text input fields", "Medium"),
        ("Mobile Password Visibility Icon", "Verify tapping mobile eye icon toggles obscureText property", "Tap eye icon in password field", "Password text toggles visibility", "Low"),
        ("Mobile Logout Session Clear", "Verify tapping drawer logout clears SharedPreferences auth token", "Tap 'Logout' option in menu", "SharedPreferences cleared, returns to LoginScreen", "High"),
        ("Mobile Session Persistence", "Verify login token persists across app restart so user bypasses login", "Restart app after valid login", "App launches directly to DashboardScreen", "High")
    ]
    for i in range(31, 91):
        sub_idx = (i - 31) % len(login_subs)
        var_num = (i - 31) // len(login_subs) + 1
        sub = login_subs[sub_idx]
        cases.append({
            "test_id": f"APP-{i:04d}",
            "test_type": "Mobile Authentication",
            "module": "Login",
            "description": f"Mobile Login Case {i - 30:02d}: {sub[0]} - Variation #{var_num}",
            "precondition": "App open on LoginScreen",
            "input": f"{sub[2]} (Run #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "Appium Flutter Driver"
        })

    # 3. DASHBOARD - 50 cases (APP-0091 to APP-0140)
    dash_subs = [
        ("Mobile Dashboard Header", "Verify mobile app header displays app title and user greeting", "Inspect app bar title", "Title 'BioPatch AI' and profile icon visible", "High"),
        ("Bottom Navigation Bar", "Verify tapping bottom navbar icons switches between 4 primary screens", "Tap Home, Drug Library, Polymers, Simulation icons", "Active view updates smoothly", "High"),
        ("Mobile Summary Cards", "Verify metric cards render total simulations run and average release score", "Inspect summary cards grid", "Cards display updated integers and percentage values", "Medium"),
        ("Mobile Quick Action Button", "Verify FAB (Floating Action Button) opens new prediction sheet", "Tap '+' Floating Action Button", "Modal bottom sheet slides up", "Medium"),
        ("Mobile Chart View (fl_chart)", "Verify fl_chart release curve widget renders inside mobile screen", "Scroll to chart section", "Line chart renders with axes and legends", "High")
    ]
    for i in range(91, 141):
        sub_idx = (i - 91) % len(dash_subs)
        var_num = (i - 91) // len(dash_subs) + 1
        sub = dash_subs[sub_idx]
        cases.append({
            "test_id": f"APP-{i:04d}",
            "test_type": "Mobile UI",
            "module": "Dashboard",
            "description": f"Mobile Dashboard Case {i - 90:02d}: {sub[0]} - Variation #{var_num}",
            "precondition": "Authenticated user on Mobile Dashboard",
            "input": f"{sub[2]} (Run #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "Appium Flutter Driver"
        })

    # 4. INPUT VALIDATION - 75 cases (APP-0141 to APP-0215)
    params = ["Drug", "Polymer", "pH", "Temperature", "Moisture", "Duration", "Drug Loading", "Polymer Concentration", "Patch Thickness"]
    mob_val_types = [
        ("Mobile Valid Field Entry", "Input valid float/string values via Android keyboard", "Accepted by Flutter TextFormField", "High"),
        ("Mobile Empty Field Warning", "Leave input field blank and submit form", "FieldError text displayed under field", "High"),
        ("Mobile Negative Value Check", "Type negative number using numeric keyboard", "Validation error 'Must be >= 0'", "High"),
        ("Mobile Zero Value Boundary", "Input 0 in positive-only numeric input field", "Validation error or zero handling dialog", "Medium"),
        ("Mobile Boundary Max Value", "Input max boundary value (e.g. pH=14, Temp=60)", "Accepted within allowed range", "Medium"),
        ("Mobile Decimal Input Handling", "Input float value with decimal point e.g. 7.4", "Correctly parsed as double in Flutter", "Medium"),
        ("Mobile Special Characters Input", "Input special characters e.g. !@#$%^&*", "Sanitized/rejected by input formatter", "High"),
        ("Mobile Out of Range Large Value", "Input extremely large number 999999", "Validation error 'Exceeds maximum limit'", "Medium")
    ]
    for i in range(141, 216):
        val_idx = (i - 141) % len(mob_val_types)
        param_idx = ((i - 141) // len(mob_val_types)) % len(params)
        var_num = (i - 141) + 1
        param_name = params[param_idx]
        val_sub = mob_val_types[val_idx]
        cases.append({
            "test_id": f"APP-{i:04d}",
            "test_type": "Mobile Input Validation",
            "module": "Input Validation",
            "description": f"Mobile Input Case {i - 140:02d}: {val_sub[0]} for parameter '{param_name}' (Test #{var_num})",
            "precondition": "User on Mobile Prediction Screen",
            "input": f"Parameter: {param_name} | {val_sub[1]} (Variant #{var_num})",
            "expected_result": f"{val_sub[2]} for parameter {param_name}",
            "priority": val_sub[3],
            "automation_framework": "Appium Flutter Driver"
        })

    # 5. PREDICTION - 50 cases (APP-0216 to APP-0265)
    pred_subs = [
        ("Mobile Predict Action Button", "Verify tapping 'Run Mobile Prediction' sends API request to backend", "Tap 'Run Prediction' button", "Loading indicator overlays screen", "Critical"),
        ("Mobile Result Screen Display", "Verify prediction results render release percentage, score badge, and recommendation", "Inspect Mobile Result View", "Result summary displayed with release stats", "Critical"),
        ("Mobile Graph Interaction", "Verify touching chart data points shows release percentage tooltip on mobile", "Touch data node on fl_chart", "Tooltip card shows time and release %", "High"),
        ("Mobile Prediction Failure Error", "Verify network failure during prediction triggers retry snackbar", "Disable network connection, tap predict", "Snackbar 'Network error. Please try again.'", "High"),
        ("Mobile Reset Prediction Form", "Verify tapping reset button clears mobile form inputs", "Tap 'Reset' icon button", "Inputs reset to default values", "Medium")
    ]
    for i in range(216, 266):
        sub_idx = (i - 216) % len(pred_subs)
        var_num = (i - 216) // len(pred_subs) + 1
        sub = pred_subs[sub_idx]
        cases.append({
            "test_id": f"APP-{i:04d}",
            "test_type": "Mobile Prediction",
            "module": "Prediction",
            "description": f"Mobile Prediction Case {i - 215:02d}: {sub[0]} - Variation #{var_num}",
            "precondition": "Mobile app on simulation form",
            "input": f"{sub[2]} (Run #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "Appium Flutter Driver"
        })

    # 6. MOBILE NAVIGATION / UI - 35 cases (APP-0266 to APP-0300)
    nav_subs = [
        ("Android Hardware Back Button", "Verify pressing Android system back button returns to previous screen", "Press Android back button", "App pops current route in stack", "High"),
        ("Screen Transition Animation", "Verify screen transitions use standard Flutter Material page route transition", "Navigate between screens", "Smooth slide/fade animation", "Low"),
        ("Screen Orientation Rotation", "Verify layout adapts gracefully when rotating device from Portrait to Landscape", "Rotate device to landscape", "Scrollable layout prevents pixel overflow errors", "Medium"),
        ("Keyboard Auto Scroll", "Verify tapping input field scrolls view so input is not obscured by soft keyboard", "Tap bottom input field", "Screen automatically scrolls field into view", "High"),
        ("Scroll List Drag Gesture", "Verify vertical drag gesture smoothly scrolls long drug/polymer catalog lists", "Drag up on drug library list", "List scrolls smoothly with inertia", "Medium")
    ]
    for i in range(266, 301):
        sub_idx = (i - 266) % len(nav_subs)
        var_num = (i - 266) // len(nav_subs) + 1
        sub = nav_subs[sub_idx]
        cases.append({
            "test_id": f"APP-{i:04d}",
            "test_type": "Mobile Navigation & Gestures",
            "module": "Mobile Navigation/UI",
            "description": f"Mobile Navigation Case {i - 265:02d}: {sub[0]} - Test #{var_num}",
            "precondition": "Mobile app open on test device",
            "input": f"{sub[2]} (Scenario #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "Appium Flutter Driver"
        })

    return cases


def generate_security_cases():
    cases = []
    
    # 1. AUTHENTICATION SECURITY - 40 cases (SEC-0001 to SEC-0040)
    auth_sec = [
        ("Unauthorized Route Access", "Attempt GET request to /api/simulations without Authorization header", "GET /api/simulations (No header)", "HTTP 401 Unauthorized", "Critical"),
        ("Invalid Bearer Token", "Attempt GET request with corrupted JWT token header 'Bearer invalid.jwt.token'", "GET /api/simulations (Malformed token)", "HTTP 401 Unauthorized", "Critical"),
        ("Expired JWT Token", "Attempt API access using artificially expired JWT token payload", "GET /api/simulations (Expired token)", "HTTP 401 Token Expired", "High"),
        ("Post-Logout Token Invalidation", "Verify token cannot be used after user clicks logout action", "GET /api/simulations with logged-out token", "HTTP 401 Unauthorized", "High"),
        ("Login Brute Force Mitigation", "Send 20 rapid invalid login requests from single IP address", "20x POST /api/auth/login with bad pwd", "HTTP 429 Too Many Requests rate limit triggered", "High")
    ]
    for i in range(1, 41):
        sub_idx = (i - 1) % len(auth_sec)
        var_num = (i - 1) // len(auth_sec) + 1
        sub = auth_sec[sub_idx]
        cases.append({
            "test_id": f"SEC-{i:04d}",
            "test_type": "Security - Auth",
            "module": "Authentication Security",
            "description": f"Auth Security Case {i:02d}: {sub[0]} - Probe #{var_num}",
            "precondition": "Backend FastAPI service reachable",
            "input": f"{sub[2]} (Variant #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "PyTest Requests Security"
        })

    # 2. INPUT SECURITY - 50 cases (SEC-0041 to SEC-0090)
    inp_sec = [
        ("XSS Payload Injection", "POST string field with XSS script tag '<script>alert(document.cookie)</script>'", "Payload in drugName/comment field", "Sanitized or html-encoded, no execution", "Critical"),
        ("SQL Injection Payload", "POST parameter with SQL injection `' OR '1'='1'; DROP TABLE users; --`", "Payload in username / query field", "Parameterized query handles input safely, no SQL execution", "Critical"),
        ("HTML Code Injection", "POST payload with embedded HTML tags '<h1>Hacked BioPatch</h1>'", "Payload in string parameter", "Stripped or rendered as literal text", "High"),
        ("Special Character Payload", "POST payload containing control characters '\\x00\\x1a\\x0d\\x0a'", "Payload in request string", "Sanitized or 422 Unprocessable Entity", "Medium"),
        ("Oversized Buffer Payload", "POST oversized payload (> 2MB string) to prediction endpoint", "2MB string in parameter field", "HTTP 413 Payload Too Large or 422 error", "High")
    ]
    for i in range(41, 91):
        sub_idx = (i - 41) % len(inp_sec)
        var_num = (i - 41) // len(inp_sec) + 1
        sub = inp_sec[sub_idx]
        cases.append({
            "test_id": f"SEC-{i:04d}",
            "test_type": "Security - Input Handling",
            "module": "Input Security",
            "description": f"Input Security Case {i - 40:02d}: {sub[0]} - Payload #{var_num}",
            "precondition": "Backend FastAPI endpoint reachable",
            "input": f"{sub[2]} (Payload variant #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "PyTest Requests Security"
        })

    # 3. API SECURITY - 40 cases (SEC-0091 to SEC-0130)
    api_sec = [
        ("Missing Required API Field", "POST /api/simulations missing 'drugName' parameter field", "POST body missing mandatory key", "HTTP 422 Unprocessable Entity with error list", "High"),
        ("Incorrect Data Type Injection", "POST numeric field with array data type `{'temperature': [1,2,3]}`", "POST body with wrong data type", "HTTP 422 Validation Error returned", "High"),
        ("Unauthorized Admin Endpoint Access", "Attempt GET request to restricted /api/admin/users as standard researcher", "GET /api/admin/users", "HTTP 403 Forbidden status returned", "Critical"),
        ("Method Not Allowed Check", "Send PUT request to GET-only endpoint /api/drugs", "PUT /api/drugs", "HTTP 405 Method Not Allowed", "Medium"),
        ("CORS Preflight Security", "Send OPTIONS preflight request with unauthorized Origin header", "OPTIONS header Origin: http://malicious-site.com", "Access-Control-Allow-Origin restricts access", "High")
    ]
    for i in range(91, 131):
        sub_idx = (i - 91) % len(api_sec)
        var_num = (i - 91) // len(api_sec) + 1
        sub = api_sec[sub_idx]
        cases.append({
            "test_id": f"SEC-{i:04d}",
            "test_type": "Security - API Validation",
            "module": "API Security",
            "description": f"API Security Case {i - 90:02d}: {sub[0]} - Check #{var_num}",
            "precondition": "Backend service active",
            "input": f"{sub[2]} (Variant #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "PyTest Requests Security"
        })

    # 4. SECURITY HEADERS - 20 cases (SEC-0131 to SEC-0150)
    sec_head = [
        ("HTTPS Transport Security", "Verify HSTS header Strict-Transport-Security presence", "Inspect response headers", "Strict-Transport-Security header configured", "High"),
        ("Content-Security-Policy (CSP)", "Verify CSP header restricts script-src and object-src", "Inspect CSP header value", "CSP header present with restrictive directives", "High"),
        ("X-Content-Type-Options Header", "Verify X-Content-Type-Options is set to 'nosniff'", "Inspect response headers", "X-Content-Type-Options: nosniff present", "Medium"),
        ("X-Frame-Options Header", "Verify X-Frame-Options is set to 'DENY' or 'SAMEORIGIN' to prevent clickjacking", "Inspect response headers", "X-Frame-Options present", "High"),
        ("Referrer-Policy Header", "Verify Referrer-Policy header is configured to 'strict-origin-when-cross-origin'", "Inspect response headers", "Referrer-Policy header set", "Medium")
    ]
    for i in range(131, 151):
        sub_idx = (i - 131) % len(sec_head)
        var_num = (i - 131) // len(sec_head) + 1
        sub = sec_head[sub_idx]
        cases.append({
            "test_id": f"SEC-{i:04d}",
            "test_type": "Security - Headers",
            "module": "Security Headers",
            "description": f"Security Headers Case {i - 130:02d}: {sub[0]} - Probe #{var_num}",
            "precondition": "Web server active",
            "input": f"{sub[2]} (Variant #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "PyTest Requests Security"
        })

    # 5. SECRETS / CONFIGURATION - 25 cases (SEC-0151 to SEC-0175)
    secrets_sec = [
        ("No Hardcoded Passwords in Code", "Audit codebase repository for plain-text password strings or DB credentials", "Static code search", "Zero hardcoded credentials found in commit history", "Critical"),
        ("Firebase Private Key Protection", "Verify Firebase service account private key is read from ENV variable", "Inspect config files", "Private key loaded securely via os.getenv()", "Critical"),
        ("No API Secrets in Web Client JS", "Verify compiled Vite React JS bundles do not contain private server secrets", "Scan web/dist JS files", "No secret keys found in public assets", "High"),
        ("Environment Variables Check", "Verify .env file is included in .gitignore and .env.example exists", "Check git status & .gitignore", ".env excluded from git tracking", "High"),
        ("Debug Mode Disabled in Production", "Verify debug mode is set to False in production config", "Check FastAPI app settings", "debug=False in production build", "High")
    ]
    for i in range(151, 176):
        sub_idx = (i - 151) % len(secrets_sec)
        var_num = (i - 151) // len(secrets_sec) + 1
        sub = secrets_sec[sub_idx]
        cases.append({
            "test_id": f"SEC-{i:04d}",
            "test_type": "Security - Config & Secrets",
            "module": "Secrets/Configuration",
            "description": f"Secrets Security Case {i - 150:02d}: {sub[0]} - Audit #{var_num}",
            "precondition": "Source code repository",
            "input": f"{sub[2]} (Audit run #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "PyTest Static Security Scanner"
        })

    # 6. ERROR / INFORMATION DISCLOSURE - 25 cases (SEC-0176 to SEC-0200)
    info_sec = [
        ("No Stack Trace in 500 Responses", "Trigger internal server exception and inspect HTTP 500 payload", "Send malformed request causing error", "Clean JSON error response without Python traceback", "High"),
        ("Database Query Masking", "Verify database connection failure does not leak DB host or password in error", "Simulate DB timeout", "Generic 'Database error occurred' message", "Critical"),
        ("Server Banner Hiding", "Verify Server HTTP response header does not reveal exact software versions", "Inspect HTTP response headers", "Server header masked or removed", "Low"),
        ("Internal File Path Obfuscation", "Verify error messages do not disclose absolute server disk paths (e.g. C:\\Users\\...)", "Inspect error messages", "No server disk path strings exposed", "Medium"),
        ("No Verbose Logs in Responses", "Verify production API responses omit internal debug log arrays", "Inspect HTTP response JSON", "No sensitive debug details present", "Medium")
    ]
    for i in range(176, 201):
        sub_idx = (i - 176) % len(info_sec)
        var_num = (i - 176) // len(info_sec) + 1
        sub = info_sec[sub_idx]
        cases.append({
            "test_id": f"SEC-{i:04d}",
            "test_type": "Security - Info Disclosure",
            "module": "Error/Information Disclosure",
            "description": f"Info Disclosure Case {i - 175:02d}: {sub[0]} - Audit #{var_num}",
            "precondition": "Backend service active",
            "input": f"{sub[2]} (Audit #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "PyTest Requests Security"
        })

    return cases


def generate_load_cases():
    cases = []
    
    # 1. HOME / API LOAD - 30 cases (LOAD-0001 to LOAD-0030)
    home_load = [
        ("Home Page HTML Latency", "Measure response time for GET / under baseline load", "GET / (10 requests)", "Average response time < 100ms", "High"),
        ("Health API Response Time", "Measure response time for GET /health endpoint under load", "GET /api/health (20 requests)", "Average response time < 50ms, 0% error rate", "Critical"),
        ("Static Bundle Download Speed", "Measure download throughput for Vite web JS bundle", "GET /src/main.jsx (15 requests)", "Assets served with HTTP 200/304 fast response", "Medium")
    ]
    for i in range(1, 31):
        sub_idx = (i - 1) % len(home_load)
        var_num = (i - 1) // len(home_load) + 1
        sub = home_load[sub_idx]
        cases.append({
            "test_id": f"LOAD-{i:04d}",
            "test_type": "Performance - Baseline",
            "module": "Home/API Load",
            "description": f"Home Load Case {i:02d}: {sub[0]} - Benchmark #{var_num}",
            "precondition": "Target environment running on localhost",
            "input": f"{sub[2]} (Run #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "PyTest Load Runner / k6"
        })

    # 2. LOGIN / API LOAD - 30 cases (LOAD-0031 to LOAD-0060)
    login_load = [
        ("Login Endpoint Throughput", "Measure authentication requests processed per second", "POST /api/auth/login (50 reqs)", "Throughput > 50 req/sec, P95 < 200ms", "High"),
        ("Token Generation Latency", "Measure time required to hash password and mint JWT token", "POST /api/auth/login valid creds", "Avg time < 150ms per token", "High"),
        ("Invalid Login Response Speed", "Measure rejection speed for invalid authentication attempts", "POST /api/auth/login invalid creds", "Avg rejection response time < 100ms", "Medium")
    ]
    for i in range(31, 61):
        sub_idx = (i - 31) % len(login_load)
        var_num = (i - 31) // len(login_load) + 1
        sub = login_load[sub_idx]
        cases.append({
            "test_id": f"LOAD-{i:04d}",
            "test_type": "Performance - Auth Load",
            "module": "Login/API Load",
            "description": f"Login Load Case {i - 30:02d}: {sub[0]} - Benchmark #{var_num}",
            "precondition": "Backend running",
            "input": f"{sub[2]} (Run #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "PyTest Load Runner / k6"
        })

    # 3. PREDICTION API LOAD - 80 cases (LOAD-0061 to LOAD-0140)
    pred_load = [
        ("Random Forest ML Inference Latency", "Measure ML model prediction execution speed for 1 simulation run", "POST /api/simulations/run (Metformin-PLA)", "Inference time < 50ms, response total < 150ms", "Critical"),
        ("Varied Drug-Polymer Combinations Load", "Test prediction throughput across 10 distinct drug and polymer pairs", "10 different drug/polymer API payloads", "All combinations process with 0% error rate", "High"),
        ("Boundary Values Prediction Speed", "Measure ML prediction calculation speed with maximum boundary parameters", "pH=14, Temp=60, Loading=50%", "Calculation completes without timeout", "High"),
        ("Invalid Parameters Error Latency", "Measure fast-fail validation speed when sending bad input payload", "pH=-5 (invalid input)", "Fast validation response < 30ms", "Medium"),
        ("Concurrent Prediction Calls", "Submit 20 simultaneous POST /api/simulations/run requests", "20 concurrent API calls", "All 20 return HTTP 200 within 500ms total", "Critical")
    ]
    for i in range(61, 141):
        sub_idx = (i - 61) % len(pred_load)
        var_num = (i - 61) // len(pred_load) + 1
        sub = pred_load[sub_idx]
        cases.append({
            "test_id": f"LOAD-{i:04d}",
            "test_type": "Performance - ML Inference",
            "module": "Prediction API Load",
            "description": f"Prediction Load Case {i - 60:02d}: {sub[0]} - Benchmark #{var_num}",
            "precondition": "Backend FastAPI ML model loaded",
            "input": f"{sub[2]} (Scenario #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "PyTest Load Runner / k6"
        })

    # 4. CONCURRENT USERS LOAD - 30 cases (LOAD-0141 to LOAD-0170)
    user_counts = [1, 5, 10, 25, 50, 100]
    for i in range(141, 171):
        idx = (i - 141) % len(user_counts)
        var_num = (i - 141) // len(user_counts) + 1
        users = user_counts[idx]
        cases.append({
            "test_id": f"LOAD-{i:04d}",
            "test_type": "Performance - Concurrency",
            "module": "Concurrent Users Load",
            "description": f"Concurrent Users Case {i - 140:02d}: {users} Virtual Users Load Test (Run #{var_num})",
            "precondition": f"System configured for {users} concurrent active user sessions",
            "input": f"Simulate {users} concurrent users making API requests (Run #{var_num})",
            "expected_result": f"Avg latency < 300ms, P95 < 600ms, P99 < 1000ms, Error rate < 1% under {users} VUs",
            "priority": "Critical" if users >= 50 else "High",
            "automation_framework": "PyTest Load Runner / k6"
        })

    # 5. STRESS / ENDURANCE LOAD - 30 cases (LOAD-0171 to LOAD-0200)
    stress_subs = [
        ("Step Ramping User Load", "Gradually ramp up virtual users from 5 to 100 over 2 minutes", "Step ramp: 5 -> 25 -> 50 -> 100 users", "System scales without dropping requests", "High"),
        ("Sustained Endurance Load", "Maintain continuous 30 req/sec load for sustained duration", "Continuous request stream", "Memory remains stable, 0% memory leak", "High"),
        ("Spike Load Test", "Inject sudden burst of 50 prediction requests within 1 second", "Spike request burst", "Server queue processes burst without crashing", "Critical"),
        ("Post-Stress System Recovery", "Measure response time immediately after stress load terminates", "Measure baseline latency post-stress", "Latency returns to baseline < 100ms within 5 seconds", "Medium")
    ]
    for i in range(171, 201):
        sub_idx = (i - 171) % len(stress_subs)
        var_num = (i - 171) // len(stress_subs) + 1
        sub = stress_subs[sub_idx]
        cases.append({
            "test_id": f"LOAD-{i:04d}",
            "test_type": "Performance - Stress/Endurance",
            "module": "Stress Endurance Load",
            "description": f"Stress Case {i - 170:02d}: {sub[0]} - Variation #{var_num}",
            "precondition": "Target server under controlled test load",
            "input": f"{sub[2]} (Run #{var_num})",
            "expected_result": f"{sub[3]}",
            "priority": sub[4],
            "automation_framework": "PyTest Load Runner / k6"
        })

    return cases


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "test_data")
    os.makedirs(data_dir, exist_ok=True)
    
    selenium = generate_selenium_cases()
    appium = generate_appium_cases()
    security = generate_security_cases()
    load = generate_load_cases()
    
    print(f"Generated Selenium cases: {len(selenium)}")
    print(f"Generated Appium cases: {len(appium)}")
    print(f"Generated Security cases: {len(security)}")
    print(f"Generated Load cases: {len(load)}")
    print(f"Total cases: {len(selenium) + len(appium) + len(security) + len(load)}")
    
    with open(os.path.join(data_dir, "selenium_tests.json"), "w", encoding="utf-8") as f:
        json.dump(selenium, f, indent=2)
        
    with open(os.path.join(data_dir, "appium_tests.json"), "w", encoding="utf-8") as f:
        json.dump(appium, f, indent=2)

    with open(os.path.join(data_dir, "security_tests.json"), "w", encoding="utf-8") as f:
        json.dump(security, f, indent=2)

    with open(os.path.join(data_dir, "load_tests.json"), "w", encoding="utf-8") as f:
        json.dump(load, f, indent=2)
        
    print("Test data JSON files written successfully!")

if __name__ == "__main__":
    main()
