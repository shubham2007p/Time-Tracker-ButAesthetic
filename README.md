# Time Canvas

A minimalist, high-fidelity web-based visualizer designed to reflect the passage of time. Emphasizing typography, spacing, and structured layouts, Time Canvas visualizes time as a steady, quiet progression rather than a metric to track or optimize.

## Key Features

- **Progress Arc**: An animated SVG-based semi-circular progress meter that represents the elapsed percentage of the selected time span.
- **Passage Grids**:
  - **Day View**: 24 dots representing hours, transitioning from completed (accent color) to current (gray) and future (neutral).
  - **Week View**: 168 dots representing hours across the week.
  - **Month View**: Dynamic grid showing days in the current month, with a segmented control to switch into hourly sub-grids (24 micro-dots per day).
  - **Year View**: 12 monthly cards showing days of the year, with a segmented control to expand each day into 24 micro-dots for detailed hourly visualization.
- **Minimalist Metrics**: Clean, live calculations showing time elapsed and remaining in hours, days, weeks, and percentages.
- **Theme Modes**: Automated system theme detection with manual toggle options (Light, Dark, and System). Preference is persisted locally.

## Download

You can download the latest version of the application directly using the link below:

[Download Source Code (ZIP)](https://github.com/shubham2007p/Time-Tracker-ButAesthetic/archive/refs/heads/main.zip)

## Local Setup

Time Canvas is built entirely using standard frontend technologies (HTML5, CSS3, and modern Vanilla ES6+ JavaScript) and runs fully inside the web browser without external database integrations, server backends, or third-party APIs.

To run the application locally:

1. Clone or download and extract the repository.
2. Navigate to the project directory:
   ```bash
   cd time-canvas
   ```
3. Start a local static file server. For example:

   **Using Python (Recommended):**
   ```bash
   python -m http.server 8080
   ```

   **Using Node (npx):**
   ```bash
   npx http-server -p 8080
   ```

4. Open your web browser and navigate to:
   [http://localhost:8080](http://localhost:8080)
