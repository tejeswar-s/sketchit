# SketchIt

SketchIt is a full-featured MERN stack multiplayer drawing and guessing game. It offers a modern, polished UI, robust game logic, and a seamless player experience. Below is a comprehensive list of features and functionalities:

## Features & Functionalities

### Game Flow & Logic
- Real-time multiplayer drawing and guessing game
- Robust scoring system: points based on time left and number of guesses, normalized for fairness
- Per-round score display, color-coded and visually clear
- Drawer is excluded from guessers in the score table
- Automatic round and game progression
- "Play Again" and "Exit Game" flow for all players at game end
- Host can only start the game if at least two players are present
- Host reassignment if the host leaves; round ends if the drawer leaves
- If only one player remains, the game pauses/ends and notifies the last player
- Room closes for everyone if the host exits

### UI & UX
- Clean, modern, and responsive interface
- Home page with compact, scroll-free card layout
- Centered word/blanks display above the top bar
- "Waiting for players" modal for the last player
- Notifications for host/drawer changes and round restarts
- Leaderboard with per-round scores and action buttons for all players
- Lobby shows all players; ready status is implicit (no explicit "Ready" button)
- Host can only start the game when enough players are present

### Drawing Tools & Canvas
- Redesigned drawing tool section: colors on the left, tools on the right
- 21-color palette (3 rows x 7 columns)
- Special tools (undo, pen, eraser, fill, pen sizes) in a 3x3 matrix
- Default tool: pen; default color: white
- Undo removes only the last grouped stroke or fill
- Canvas receives correct tool, color, and width props

### Voice Chat (WebRTC + Socket.IO)
- Optional microphone/voice chat for all players
- Mic toggle button and status indicator
- Custom React hook for voice chat
- Voice activity detection and host global mute
- UI indicators for speaking/muted status
- Robust signaling with ICE candidate buffering and state checks

### Player & Room Management
- Real-time player list updates
- Host reassignment and drawer change notifications
- Player leave/host leave logic: round ends or host is reassigned as needed
- Game pauses/ends if only one player remains
- Room closes for all if host exits

### Additional Features
- Timer for word selection and round progression
- Word selection popup for drawer with countdown
- "Waiting for drawer to select word" message for others
- Modern, visually balanced color and tool palette
- All major bugs and UI/UX issues resolved

---

## Getting Started

1. Clone the repository and install dependencies in both `backend` and `frontend` folders.
2. Start the backend server (`npm start` in `backend/`).
3. Start the frontend React app (`npm start` in `frontend/`).
4. Open the app in your browser and enjoy SketchIt!

---

For more details, see the codebase and comments. Contributions and feedback are welcome! 