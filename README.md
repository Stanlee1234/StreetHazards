# StreetHazards
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>HazardHunt | Public Safety</title>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --bg: #070b12;
      --panel: #0d1420;
      --panel-light: #121c2a;
      --border: rgba(255, 255, 255, 0.09);

      --text: #f4f7fb;
      --muted: #8995a7;

      --red: #ff4757;
      --orange: #ff9f43;
      --green: #2ed573;
      --blue: #4dabf7;

      --glow-red: rgba(255, 71, 87, 0.35);
      --glow-orange: rgba(255, 159, 67, 0.3);
    }

    body {
      min-height: 100vh;
      background:
        radial-gradient(circle at 20% 10%, rgba(255, 71, 87, 0.08), transparent 30%),
        radial-gradient(circle at 80% 80%, rgba(77, 171, 247, 0.06), transparent 30%),
        var(--bg);

      color: var(--text);
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      overflow-x: hidden;
    }

    /* ================================
       BACKGROUND DECORATIONS
    ================================= */

    .background-grid {
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0.16;

      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);

      background-size: 45px 45px;
      mask-image: linear-gradient(to bottom, black, transparent);
    }

    .glow {
      position: fixed;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      filter: blur(100px);
      pointer-events: none;
      opacity: 0.12;
    }

    .glow.one {
      background: var(--red);
      top: -200px;
      left: -150px;
    }

    .glow.two {
      background: var(--blue);
      right: -200px;
      bottom: -200px;
    }

    /* ================================
       HEADER
    ================================= */

    header {
      height: 76px;
      padding: 0 32px;

      display: flex;
      align-items: center;
      justify-content: space-between;

      border-bottom: 1px solid var(--border);
      background: rgba(7, 11, 18, 0.82);

      backdrop-filter: blur(18px);

      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 13px;
    }

    .brand-icon {
      width: 42px;
      height: 42px;

      display: grid;
      place-items: center;

      border-radius: 12px;

      background:
        linear-gradient(135deg, rgba(255,71,87,0.25), rgba(255,159,67,0.1));

      border: 1px solid rgba(255, 71, 87, 0.35);

      box-shadow: 0 0 25px var(--glow-red);

      font-size: 21px;
    }

    .brand-text h1 {
      font-size: 18px;
      letter-spacing: 2px;
      font-weight: 800;
    }

    .brand-text span {
      font-size: 10px;
      color: var(--muted);
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 8px;

      padding: 8px 13px;

      border-radius: 999px;

      background: rgba(46, 213, 115, 0.07);
      border: 1px solid rgba(46, 213, 115, 0.18);

      color: #7ff0a9;

      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--green);

      box-shadow: 0 0 12px var(--green);

      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }

      50% {
        transform: scale(1.5);
        opacity: 0.5;
      }
    }

    /* ================================
       MAIN
    ================================= */

    main {
      width: min(1500px, calc(100% - 48px));
      margin: 30px auto 60px;
    }

    .game-top {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 20px;
      align-items: end;

      margin-bottom: 22px;
    }

    .eyebrow {
      color: var(--red);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .title {
      font-size: clamp(30px, 4vw, 52px);
      line-height: 0.95;
      letter-spacing: -2px;
      font-weight: 900;
    }

    .subtitle {
      margin-top: 12px;
      color: var(--muted);
      max-width: 600px;
      line-height: 1.6;
      font-size: 14px;
    }

    /* ================================
       STATS
    ================================= */

    .stats {
      display: flex;
      gap: 10px;
    }

    .stat {
      min-width: 125px;
      padding: 14px 17px;

      background: rgba(13, 20, 32, 0.85);
      border: 1px solid var(--border);

      border-radius: 14px;

      position: relative;
      overflow: hidden;
    }

    .stat::after {
      content: "";

      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;

      height: 2px;

      background: var(--red);
      opacity: 0.7;
    }

    .stat-label {
      color: var(--muted);
      font-size: 9px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .stat-value {
      margin-top: 5px;

      font-size: 23px;
      font-weight: 900;
      letter-spacing: -1px;
    }

    #timer {
      color: var(--orange);
    }

    /* ================================
       GAME LAYOUT
    ================================= */

    .game-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 330px;
      gap: 18px;
    }

    /* ================================
       SCENE
    ================================= */

    .scene-card {
      min-height: 650px;

      position: relative;
      overflow: hidden;

      border-radius: 22px;

      border: 1px solid var(--border);

      background:
        linear-gradient(
          135deg,
          rgba(18, 28, 42, 0.9),
          rgba(7, 11, 18, 0.95)
        );

      box-shadow:
        0 30px 80px rgba(0,0,0,0.3),
        inset 0 1px rgba(255,255,255,0.04);
    }

    .scene-toolbar {
      height: 58px;

      display: flex;
      align-items: center;
      justify-content: space-between;

      padding: 0 18px;

      border-bottom: 1px solid var(--border);

      background: rgba(13,20,32,0.75);

      position: relative;
      z-index: 10;
    }

    .scene-name {
      display: flex;
      align-items: center;
      gap: 9px;

      font-size: 12px;
      font-weight: 700;
    }

    .scene-name span {
      color: var(--muted);
      font-weight: 500;
    }

    .legend {
      display: flex;
      gap: 14px;

      font-size: 9px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .legend-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .legend-dot.red {
      background: var(--red);
      box-shadow: 0 0 8px var(--red);
    }

    .legend-dot.orange {
      background: var(--orange);
      box-shadow: 0 0 8px var(--orange);
    }

    /* ================================
       ARTWORK PLACEHOLDER
    ================================= */

    .artwork {
      position: relative;

      height: 592px;

      overflow: hidden;

      background:
        linear-gradient(
          to bottom,
          #18283a 0%,
          #0e1824 47%,
          #15171c 47%,
          #090c11 100%
        );
    }

    /*
      This is a temporary illustrated scene.

      Later you can replace this whole area with:

      <img src="your-drawing.png">

      or use your own SVG illustration.
    */

    .sun {
      position: absolute;

      width: 130px;
      height: 130px;

      border-radius: 50%;

      right: 12%;
      top: 12%;

      background: radial-gradient(
        circle,
        rgba(255, 181, 71, 0.8),
        rgba(255, 159, 67, 0.05) 65%,
        transparent
      );

      filter: blur(1px);
    }

    .skyline {
      position: absolute;

      left: 0;
      right: 0;
      bottom: 46%;

      height: 150px;

      display: flex;
      align-items: end;
      gap: 8px;

      padding: 0 30px;
    }

    .building {
      flex: 1;

      background:
        linear-gradient(
          to bottom,
          #202f41,
          #101923
        );

      border: 1px solid rgba(255,255,255,0.035);

      position: relative;
    }

    .building::before {
      content: "";

      position: absolute;
      inset: 12px;

      background-image:
        radial-gradient(
          circle,
          rgba(255,190,90,0.45) 2px,
          transparent 3px
        );

      background-size: 15px 18px;

      opacity: 0.45;
    }

    .building:nth-child(1) {
      height: 75%;
    }

    .building:nth-child(2) {
      height: 100%;
    }

    .building:nth-child(3) {
      height: 65%;
    }

    .building:nth-child(4) {
      height: 87%;
    }

    .building:nth-child(5) {
      height: 55%;
    }

    .building:nth-child(6) {
      height: 76%;
    }

    .road {
      position: absolute;

      left: -10%;
      right: -10%;

      bottom: -80px;

      height: 340px;

      background: #0a0d12;

      transform: perspective(400px) rotateX(14deg);

      border-top: 2px solid rgba(255,255,255,0.06);
    }

    .road-lines {
      position: absolute;

      left: 0;
      right: 0;
      top: 120px;

      height: 6px;

      background:
        repeating-linear-gradient(
          90deg,
          transparent 0 60px,
          rgba(255,255,255,0.5) 60px 110px
        );

      opacity: 0.35;
    }

    .sidewalk {
      position: absolute;

      bottom: 44%;

      left: 0;
      right: 0;

      height: 55px;

      background:
        repeating-linear-gradient(
          90deg,
          #252b34 0 90px,
          #20252d 90px 92px
        );

      border-top: 2px solid rgba(255,255,255,0.08);
      border-bottom: 2px solid rgba(255,255,255,0.03);
    }

    /* ================================
       DECORATIVE PEOPLE
    ================================= */

    .person {
      position: absolute;

      width: 15px;
      height: 38px;

      background: #3f80a7;

      border-radius: 8px 8px 4px 4px;

      z-index: 5;

      filter: drop-shadow(0 4px 5px rgba(0,0,0,0.4));
    }

    .person::before {
      content: "";

      position: absolute;

      width: 13px;
      height: 13px;

      background: #d5a47b;

      border-radius: 50%;

      top: -10px;
      left: 1px;
    }

    .person.one {
      left: 22%;
      bottom: 35%;
      transform: scale(1.2);
    }

    .person.two {
      left: 48%;
      bottom: 34%;
      background: #a75d65;
      transform: scale(0.9);
    }

    .person.three {
      left: 76%;
      bottom: 34%;
      background: #596aa4;
      transform: scale(1.1);
    }

    /* ================================
       HAZARDS
    ================================= */

    .hazard {
      position: absolute;

      width: 38px;
      height: 38px;

      border-radius: 50%;

      border: 2px solid var(--red);

      background: rgba(255,71,87,0.08);

      display: grid;
      place-items: center;

      cursor: pointer;

      z-index: 20;

      box-shadow:
        0 0 0 5px rgba(255,71,87,0.05),
        0 0 25px var(--glow-red);

      animation: hazardPulse 1.8s infinite;

      transition:
        transform 0.2s ease,
        background 0.2s ease,
        opacity 0.2s ease;
    }

    .hazard:hover {
      transform: scale(1.15);
      background: rgba(255,71,87,0.18);
    }

    .hazard::after {
      content: "!";

      font-weight: 900;
      color: white;
      font-size: 16px;
    }

    @keyframes hazardPulse {
      0%, 100% {
        box-shadow:
          0 0 0 5px rgba(255,71,87,0.05),
          0 0 20px rgba(255,71,87,0.2);
      }

      50% {
        box-shadow:
          0 0 0 10px rgba(255,71,87,0.02),
          0 0 35px rgba(255,71,87,0.5);
      }
    }

    .hazard.found {
      background: rgba(46,213,115,0.16);
      border-color: var(--green);
      box-shadow: 0 0 25px rgba(46,213,115,0.35);

      animation: none;

      cursor: default;
    }

    .hazard.found::after {
      content: "✓";
      color: var(--green);
    }

    /* Position hazards */

    .hazard.h1 {
      left: 14%;
      bottom: 39%;
    }

    .hazard.h2 {
      left: 34%;
      bottom: 51%;
    }

    .hazard.h3 {
      left: 56%;
      bottom: 37%;
    }

    .hazard.h4 {
      left: 71%;
      bottom: 48%;
    }

    .hazard.h5 {
      left: 84%;
      bottom: 31%;
    }

    /* ================================
       SIDE PANEL
    ================================= */

    .panel {
      border: 1px solid var(--border);

      border-radius: 20px;

      background: rgba(13,20,32,0.82);

      backdrop-filter: blur(15px);

      overflow: hidden;

      height: fit-content;
    }

    .panel-header {
      padding: 20px;

      border-bottom: 1px solid var(--border);
    }

    .panel-header h2 {
      font-size: 16px;
    }

    .panel-header p {
      color: var(--muted);
      font-size: 11px;
      line-height: 1.5;

      margin-top: 5px;
    }

    .mission {
      margin: 18px;

      padding: 16px;

      border-radius: 14px;

      background:
        linear-gradient(
          135deg,
          rgba(255,71,87,0.09),
          rgba(255,159,67,0.03)
        );

      border: 1px solid rgba(255,71,87,0.14);
    }

    .mission-label {
      color: var(--red);

      font-size: 9px;
      font-weight: 800;

      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .mission p {
      margin-top: 7px;

      font-size: 13px;
      line-height: 1.5;
    }

    /* ================================
       PROGRESS
    ================================= */

    .progress-wrapper {
      padding: 0 18px 18px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;

      color: var(--muted);

      font-size: 10px;
      margin-bottom: 8px;
    }

    .progress {
      height: 7px;

      background: rgba(255,255,255,0.06);

      border-radius: 999px;

      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      width: 0%;

      background:
        linear-gradient(90deg, var(--red), var(--orange));

      border-radius: inherit;

      transition: width 0.4s ease;

      box-shadow: 0 0 15px var(--glow-red);
    }

    /* ================================
       FEEDBACK
    ================================= */

    .feedback {
      margin: 0 18px 18px;

      padding: 16px;

      border-radius: 14px;

      background: rgba(255,255,255,0.025);

      border: 1px solid var(--border);

      min-height: 150px;
    }

    .feedback.empty {
      display: grid;
      place-items: center;
      text-align: center;
    }

    .feedback-icon {
      font-size: 30px;
      margin-bottom: 8px;
    }

    .feedback h3 {
      font-size: 14px;
    }

    .feedback p {
      color: var(--muted);

      font-size: 11px;
      line-height: 1.6;

      margin-top: 6px;
    }

    .severity {
      display: inline-block;

      margin-top: 10px;

      padding: 5px 8px;

      border-radius: 6px;

      font-size: 8px;
      font-weight: 800;

      letter-spacing: 1px;

      background: rgba(255,159,67,0.1);
      color: var(--orange);
    }

    /* ================================
       BUTTONS
    ================================= */

    .actions {
      padding: 0 18px 18px;
    }

    button {
      border: 0;
      cursor: pointer;
      font: inherit;
    }

    .primary-button {
      width: 100%;

      padding: 14px 18px;

      border-radius: 12px;

      color: white;

      background:
        linear-gradient(
          135deg,
          #ff4757,
          #ff6b4a
        );

      font-size: 11px;
      font-weight: 900;

      letter-spacing: 1.5px;

      box-shadow:
        0 10px 25px rgba(255,71,87,0.18);

      transition:
        transform 0.2s,
        box-shadow 0.2s;
    }

    .primary-button:hover {
      transform: translateY(-2px);

      box-shadow:
        0 14px 35px rgba(255,71,87,0.3);
    }

    /* ================================
       NOTIFICATION
    ================================= */

    .toast {
      position: fixed;

      left: 50%;
      bottom: 30px;

      transform: translate(-50%, 120px);

      padding: 13px 18px;

      border-radius: 12px;

      background: #151e2b;

      border: 1px solid var(--border);

      box-shadow: 0 20px 50px rgba(0,0,0,0.4);

      font-size: 12px;
      font-weight: 700;

      z-index: 999;

      transition: transform 0.3s ease;
    }

    .toast.show {
      transform: translate(-50%, 0);
    }

    .toast.success {
      border-color: rgba(46,213,115,0.35);
    }

    .toast.error {
      border-color: rgba(255,71,87,0.35);
    }

    /* ================================
       RESPONSIVE
    ================================= */

    @media (max-width: 1000px) {
      .game-layout {
        grid-template-columns: 1fr;
      }

      .panel {
        max-width: none;
      }
    }

    @media (max-width: 700px) {
      header {
        padding: 0 16px;
      }

      main {
        width: calc(100% - 24px);
        margin-top: 20px;
      }

      .game-top {
        grid-template-columns: 1fr;
      }

      .stats {
        width: 100%;
      }

      .stat {
        flex: 1;
        min-width: 0;
      }

      .legend {
        display: none;
      }

      .scene-card {
        min-height: 500px;
      }

      .artwork {
        height: 440px;
      }

      .title {
        font-size: 36px;
      }
    }
  </style>
</head>

<body>

  <!-- Background -->
  <div class="background-grid"></div>
  <div class="glow one"></div>
  <div class="glow two"></div>

  <!-- HEADER -->
  <header>

    <div class="brand">

      <div class="brand-icon">
        🚨
      </div>

      <div class="brand-text">
        <h1>HAZARDHUNT</h1>
        <span>Public Safety Awareness</span>
      </div>

    </div>

    <div class="status">
      <span class="status-dot"></span>
      SYSTEM ONLINE
    </div>

  </header>


  <!-- MAIN -->
  <main>

    <section class="game-top">

      <div>
        <div class="eyebrow">
          Mission 01 / Urban Awareness
        </div>

        <h2 class="title">
          Can you spot<br>
          what others miss?
        </h2>

        <p class="subtitle">
          Explore the scene and identify hidden safety hazards.
          Every observation could prevent a bigger problem.
        </p>
      </div>


      <div class="stats">

        <div class="stat">
          <div class="stat-label">
            Time
          </div>

          <div class="stat-value" id="timer">
            03:00
          </div>
        </div>

        <div class="stat">
          <div class="stat-label">
            Score
          </div>

          <div class="stat-value" id="score">
            0000
          </div>
        </div>

        <div class="stat">
          <div class="stat-label">
            Found
          </div>

          <div class="stat-value" id="found">
            0 / 5
          </div>
        </div>

      </div>

    </section>


    <section class="game-layout">

      <!-- SCENE -->
      <div class="scene-card">

        <div class="scene-toolbar">

          <div class="scene-name">
            🏙️ Downtown District
            <span>/ Observation Area</span>
          </div>

          <div class="legend">

            <div class="legend-item">
              <span class="legend-dot red"></span>
              Undiscovered
            </div>

            <div class="legend-item">
              <span class="legend-dot orange"></span>
              Investigate
            </div>

          </div>

        </div>


        <!-- ARTWORK -->

        <div class="artwork">

          <div class="sun"></div>

          <div class="skyline">

            <div class="building"></div>
            <div class="building"></div>
            <div class="building"></div>
            <div class="building"></div>
            <div class="building"></div>
            <div class="building"></div>

          </div>

          <div class="sidewalk"></div>

          <div class="road">
            <div class="road-lines"></div>
          </div>


          <!-- People -->

          <div class="person one"></div>
          <div class="person two"></div>
          <div class="person three"></div>


          <!-- HAZARDS -->

          <button
            class="hazard h1"
            data-name="Blocked Walkway"
            data-description="An object is obstructing a pedestrian pathway."
            data-severity="MODERATE"
            aria-label="Hazard 1">
          </button>

          <button
            class="hazard h2"
            data-name="Blocked Emergency Exit"
            data-description="The emergency exit is partially obstructed and may slow evacuation."
            data-severity="HIGH"
            aria-label="Hazard 2">
          </button>

          <button
            class="hazard h3"
            data-name="Unsafe Crossing"
            data-description="A pedestrian is positioned near a potentially unsafe crossing point."
            data-severity="HIGH"
            aria-label="Hazard 3">
          </button>

          <button
            class="hazard h4"
            data-name="Crowd Bottleneck"
            data-description="People are gathering around a narrow passage, creating a potential bottleneck."
            data-severity="MODERATE"
            aria-label="Hazard 4">
          </button>

          <button
            class="hazard h5"
            data-name="Emergency Access Obstruction"
            data-description="An object is positioned where it could interfere with emergency access."
            data-severity="HIGH"
            aria-label="Hazard 5">
          </button>

        </div>

      </div>


      <!-- SIDE PANEL -->

      <aside class="panel">

        <div class="panel-header">

          <h2>🔎 Investigation</h2>

          <p>
            Examine the illustration carefully.
            Click anything you believe could create a safety risk.
          </p>

        </div>


        <div class="mission">

          <div class="mission-label">
            Current Objective
          </div>

          <p>
            Find all <strong>5 hidden hazards</strong>
            before time runs out.
          </p>

        </div>


        <div class="progress-wrapper">

          <div class="progress-info">

            <span>INVESTIGATION PROGRESS</span>

            <span id="progressText">
              0%
            </span>

          </div>

          <div class="progress">

            <div
              class="progress-bar"
              id="progressBar">
            </div>

          </div>

        </div>


        <div
          class="feedback empty"
          id="feedback">

          <div>

            <div class="feedback-icon">
              👁️
            </div>

            <h3>
              Start observing
            </h3>

            <p>
              Look closely at the scene.
              Some hazards are easier to notice than others.
            </p>

          </div>

        </div>


        <div class="actions">

          <button
            class="primary-button"
            id="resetButton">

            ↻ RESTART INVESTIGATION

          </button>

        </div>

      </aside>

    </section>

  </main>


  <div
    class="toast"
    id="toast">
  </div>


  <script>

    /* =================================
       GAME STATE
    ================================= */

    let score = 0;
    let found = 0;
    let timeLeft = 180;

    const totalHazards = 5;

    let timerInterval;


    /* =================================
       DOM
    ================================= */

    const timerElement =
      document.getElementById("timer");

    const scoreElement =
      document.getElementById("score");

    const foundElement =
      document.getElementById("found");

    const progressBar =
      document.getElementById("progressBar");

    const progressText =
      document.getElementById("progressText");

    const feedback =
      document.getElementById("feedback");

    const toast =
      document.getElementById("toast");

    const hazards =
      document.querySelectorAll(".hazard");


    /* =================================
       TIMER
    ================================= */

    function startTimer() {

      clearInterval(timerInterval);

      timerInterval = setInterval(() => {

        timeLeft--;

        updateTimer();

        if (timeLeft <= 0) {

          clearInterval(timerInterval);

          showToast(
            "⏱️ Time's up! Investigation complete.",
            "error"
          );

        }

      }, 1000);

    }


    function updateTimer() {

      const minutes =
        Math.floor(timeLeft / 60)
          .toString()
          .padStart(2, "0");

      const seconds =
        (timeLeft % 60)
          .toString()
          .padStart(2, "0");

      timerElement.textContent =
        `${minutes}:${seconds}`;

    }


    /* =================================
       HAZARD CLICK
    ================================= */

    hazards.forEach(hazard => {

      hazard.addEventListener("click", () => {

        if (hazard.classList.contains("found")) {
          return;
        }

        hazard.classList.add("found");

        found++;

        score += 100;

        const name =
          hazard.dataset.name;

        const description =
          hazard.dataset.description;

        const severity =
          hazard.dataset.severity;


        scoreElement.textContent =
          score.toString().padStart(4, "0");

        foundElement.textContent =
          `${found} / ${totalHazards}`;


        const percentage =
          Math.round(
            (found / totalHazards) * 100
          );

        progressBar.style.width =
          `${percentage}%`;

        progressText.textContent =
          `${percentage}%`;


        feedback.classList.remove("empty");

        feedback.innerHTML = `

          <div>

            <div class="feedback-icon">
              🚨
            </div>

            <h3>
              ${name}
            </h3>

            <p>
              ${description}
            </p>

            <span class="severity">
              ${severity} RISK · +100 POINTS
            </span>

          </div>

        `;


        showToast(
          `✓ Hazard identified: ${name}`,
          "success"
        );


        if (found === totalHazards) {

          clearInterval(timerInterval);

          setTimeout(() => {

            showToast(
              "🏆 Investigation complete! All hazards found.",
              "success"
            );

          }, 400);

        }

      });

    });


    /* =================================
       RESET
    ================================= */

    document
      .getElementById("resetButton")
      .addEventListener("click", resetGame);


    function resetGame() {

      score = 0;
      found = 0;
      timeLeft = 180;

      hazards.forEach(hazard => {
        hazard.classList.remove("found");
      });

      scoreElement.textContent = "0000";

      foundElement.textContent =
        `0 / ${totalHazards}`;

      progressBar.style.width = "0%";

      progressText.textContent = "0%";


      feedback.className =
        "feedback empty";

      feedback.innerHTML = `

        <div>

          <div class="feedback-icon">
            👁️
          </div>

          <h3>
            Start observing
          </h3>

          <p>
            Look closely at the scene.
            Some hazards are easier to notice than others.
          </p>

        </div>

      `;


      updateTimer();

      startTimer();

      showToast(
        "Investigation restarted.",
        "success"
      );

    }


    /* =================================
       TOAST
    ================================= */

    let toastTimeout;

    function showToast(message, type) {

      clearTimeout(toastTimeout);

      toast.textContent = message;

      toast.className =
        `toast show ${type}`;

      toastTimeout =
        setTimeout(() => {

          toast.classList.remove("show");

        }, 2500);

    }


    /* =================================
       START
    ================================= */

    updateTimer();

    startTimer();

  </script>

</body>
</html>