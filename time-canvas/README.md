# Time Canvas

Time Canvas is a calm, premium, and minimalist visualization of the passage of time. Inspired by Nothing OS, OnePlus, Dieter Rams, and the GitHub Contribution Graph.

This is not a productivity tool, habit tracker, or time logger. It is purely a visual reflection of time.

## Design Philosophy

- **Minimalist**: High whitespace, no unnecessary UI elements.
- **Typography First**: Heavy focus on clean, bold headers indicating the current time.
- **Visuals**: Simple dot grid elements that update dynamically.
- **Color Scale**: Uses an Accent Red (`#FF2E2E`) for elapsed time, Gray (`#7C7C7C`/`#888888`) for the present, and White/Dark Gray for the future. No gradients, glassmorphism, or skeuomorphism.

## Tech Stack

- **Core**: HTML5, CSS3, Vanilla ES6+ JavaScript.
- **No external dependencies**: Runs entirely in the browser without any libraries, frameworks, or APIs.

## File Structure

```
time-canvas/
├── README.md
├── index.html
├── css/
│   ├── variables.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── themes.css
│   ├── animations.css
│   └── responsive.css
└── js/
    ├── app.js
    ├── router.js
    ├── time.js
    ├── renderer.js
    ├── day.js
    ├── week.js
    ├── month.js
    ├── year.js
    ├── theme.js
    └── utils.js
```

## Running Locally

To run the application locally, you can use any static file server. For example:

### Using Python:
```bash
python -m http.server 8080
```

### Using Node (npx):
```bash
npx http-server -p 8080
```

Then, open your browser and navigate to `http://localhost:8080`.
