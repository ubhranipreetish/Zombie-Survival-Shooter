# Zombie Survival Shooter

A wave-based 2D browser survival game built with Next.js, React, and TypeScript, rendered on HTML5 Canvas. The project is structured using Object-Oriented Design and adheres to the SOLID principles.

Live: https://zombie-survival-shooter.vercel.app  
Repository: https://github.com/ubhranipreetish/Zombie-Survival-Shooter

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 |
| UI Library | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Rendering | HTML5 Canvas 2D API |
| Package Manager | npm |
| Deployment | Vercel |
| Version Control | Git and GitHub |

---

## Setup and Installation

**Prerequisites:** Node.js v18 or higher, npm v9 or higher, Git.

```bash
# Clone the repository
git clone https://github.com/ubhranipreetish/Zombie-Survival-Shooter.git
cd Zombie-Survival-Shooter

# Install dependencies
npm install
```

No environment variables are required to run the project locally.

---

## How to Run

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build
npm start

# Lint and type check
npm run lint
npx tsc --noEmit
```

---

## Architecture

```mermaid
graph TD
    %% Architecture Styling
    classDef frontend fill:#3b82f6,stroke:#fff,stroke-width:2px,color:#fff
    classDef core fill:#10b981,stroke:#fff,stroke-width:2px,color:#fff
    classDef system fill:#8b5cf6,stroke:#fff,stroke-width:2px,color:#fff
    classDef entity fill:#f59e0b,stroke:#fff,stroke-width:2px,color:#fff
    
    subgraph Browser [Browser / React Client]
        UI[Next.js UI & React State]:::frontend
        Canvas[HTML5 2D Render Target]:::frontend
    end
    
    subgraph Engine [Core Game Engine]
        MainLoop[Main Loop requestAnimationFrame]:::core
        Renderer[Canvas Renderer]:::core
        Input[Input & Mouse Manager]:::core
    end
    
    subgraph SubSystems [Sub-System Logic]
        Wave[Wave Spawning Manager]:::system
        Collision[Collision & Physics System]:::system
        Card[Card & Experience System]:::system
    end
    
    subgraph Entities [Memory Game Objects]
        Player[Player Entity]:::entity
        Enemies[Zombies / Boss Nodes]:::entity
        Bullets[Projectiles Array]:::entity
    end
    
    %% Directional Interactions
    UI -->|Sends Input Streams| Input
    UI -.->|Maintains Bounds| Canvas
    Input -->|Triggers Actions| MainLoop
    
    MainLoop <-->|Orchestrates Game Logic| SubSystems
    MainLoop -.->|Delegates Paint Frame| Renderer
    Renderer -->|Draws Frame| Canvas
    
    Wave -->|Instantiates| Enemies
    Card -->|Injects Upgrades| Player
    Collision -->|Validates Vector Hitboxes| Entities
    
    MainLoop <-->|Calls update()| Entities
```

The project is divided into four layers:

**Presentation Layer** — React components handle all UI concerns: the game canvas, HUD, main menu, pause menu, card selection, and game over screen.

**Game Engine Layer** — A custom engine built in TypeScript manages the core game loop via `requestAnimationFrame`. Key modules include `GameEngine`, `WaveManager`, `CollisionManager`, `InputManager`, and `Renderer`.

**Entity Layer** — All game objects extend a base `GameObject` class. The `Enemy` abstract class is subclassed into six zombie types and five boss encounters. Weapons implement a shared `IWeaponStrategy` interface. New types can be added without modifying existing code.

**Supporting Systems** — Standalone modules handle audio (`AudioSystem`), experience and levelling (`ExpSystem`), card-based upgrades (`CardSystem`), and player abilities (`AbilitySystem`). An `EventBus` decouples communication between systems using a publish-subscribe pattern. A `ZombieFactory` centralises enemy creation per wave configuration.

**Design patterns used:** Strategy (weapons), Factory (enemy creation), Observer (EventBus), Singleton (GameEngine), State (game state machine), Object Pool (bullets and particles).

UML diagrams covering the class hierarchy, use cases, sequence flows, and entity relationships are available in the `diagrams/` directory.

---

## Team and Contributions

| Name | Role 
|---|---|
| Preetish Ubhrani | Project Lead and Game Architect 
| Aditya Bhardwaj | Game Systems Developer 
| Kshitiz Surana | Frontend Developer 
| Pushkar Jain | Systems Developer 
