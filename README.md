# Synapse

Synapse is a cognitive workspace designed to reduce digital eye strain and cognitive overload. By merging Zettelkasten principles with a minimalist interface, it serves as an operating system for knowledge work, allowing users to capture, connect, and develop ideas with minimal friction.

## Overview

The application is built on the philosophy of "Zen Productivity," prioritizing focus, semantic connections, and visual comfort. It features a warm, dark-mode color palette designed to minimize blue light exposure and utilizes organic animations to maintain user flow.

## Key Features

### Zen Editor
A distraction-free writing environment that supports rich text and bi-directional linking.
*   **Slash Commands:** Quick formatting and block insertion.
*   **Focus Mode:** Hides all interface elements to prioritize writing.
*   **Wiki-Links:** Connect thoughts instantly to create a network of knowledge.

### Neural Graph View
An interactive visualization of the knowledge base.
*   **Force-Directed Graph:** Powered by D3.js to simulate organic relationships between notes.
*   **Semantic Highlighting:** Focus on specific nodes to illuminate connected concepts while dimming noise.
*   **Omnibar:** Rapid navigation and filtering of the node constellation.

### Agenda
A task management system based on energy capacity rather than rigid scheduling.
*   **Energy visualization:** Monitors daily cognitive load.
*   **Focus Timer:** Integrated tools for deep work sessions.
*   **Natural Language Processing:** Intelligent parsing of task inputs.

### Cortex (AI Integration)
Leverages Google Gemini models to act as a passive cognitive assistant.
*   **Auto-Tagging:** Automatically categorizes content based on semantic analysis.
*   **Task Breakdown:** Decomposes complex tasks into actionable steps.
*   **Semantic Linking:** Suggests relationships between disparate notes.

## Technical Stack

*   **Core:** React 18, TypeScript, Vite.
*   **Styling:** Tailwind CSS with a custom design token system.
*   **Visualization:** D3.js.
*   **AI:** Google Generative AI SDK (Gemini).
*   **Icons:** Lucide React.
*   **Persistence:** LocalStorage (Architected for Firebase/Cloud synchronization).

## Installation

**Prerequisites:** Node.js (v18+)

1.  Clone the repository:
    ```bash
    git clone https://github.com/username/synapse.git
    cd synapse
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm start
    ```

4.  Access the application at `http://localhost:3000`.

## Configuration

To enable AI features, an API key is required:

1.  Obtain an API key from Google AI Studio.
2.  Navigate to **Settings > Cortex** within the application.
3.  Enter the API key. It is stored locally within the browser.

## License

This project is licensed under the MIT License.