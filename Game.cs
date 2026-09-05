#if false
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
#endif