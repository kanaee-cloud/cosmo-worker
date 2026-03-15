# Cosmo AI Worker

This is the AI backend service for the Cosmo Productivity App. It handles:
1.  **Quiz Generation**: Generates 3 multiple-choice questions from mission logs using Gemini AI.
2.  **Mission Validation**: Validates proof (images) for physical/general tasks using Gemini's vision capabilities and calculates XP rewards.

## Tech Stack
-   Node.js
-   TypeScript
-   Express
-   Google Gemini API (gemini-1.5-flash)

## Setup
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create `.env` file and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_key_here
    PORT=3000
    ```
3.  Run in development mode:
    ```bash
    npm run dev
    ```

## API Endpoints

### 1. Generate Quiz
-   **URL**: `POST /api/quiz`
-   **Body**:
    ```json
    {
      "mission_log": "I studied React Hooks specifically useState and useEffect.",
      "difficulty": "medium"
    }
    ```
-   **Response**: JSON array of questions.

### 2. Validate Mission
-   **URL**: `POST /api/validate`
-   **Body**:
    ```json
    {
      "title": "Clean the room",
      "description": "Swept the floor and organized the desk.",
      "imageUrl": "https://supabase-bucket-url..."
    }
    ```
-   **Response**:
    ```json
    {
      "success": true,
      "result": {
        "isValid": true,
        "confidence": 0.9,
        "difficulty_rating": 4,
        "xp_awarded": 80,
        "reasoning": "Image shows a clean floor..."
      }
    }
    ```

## Deployment (Vercel)
This project is configured for Vercel Serverless Functions.
1.  Push to GitHub.
2.  Import to Vercel.
3.  Set `GEMINI_API_KEY` in Vercel Environment Variables.
4.  Deploy.
