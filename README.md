
# DeKUT Campus Marketplace

A high-performance student marketplace for Dedan Kimathi University of Technology.

## Full-Stack Architecture
This application is now connected to a robust FastAPI and PostgreSQL backend.
- **Backend**: FastAPI (Python) running on `localhost:8000`.
- **Database**: PostgreSQL for persistent, relational data management.
- **AI-Powered**: Integrated with Google Gemini API for automated product descriptions.

## Getting Started

### Prerequisites
- Node.js installed.
- Python installed (for the backend).

### 1. Setup Backend
   - Navigate to the backend directory (if separate) or ensure you have the backend code.
   - Ensure PostgreSQL is running.
   - Install dependencies: `pip install -r requirements.txt`.
   - Run the server: `uvicorn main:app --reload`.

### 2. Setup Frontend
   - Open the project in VS Code.
   - Install dependencies:
     ```bash
     npm install
     ```
   - Create a `.env` file in the root directory (if not present) and add your API keys:
     ```env
     VITE_GOOGLE_API_KEY="your_google_api_key"
     VITE_SUPABASE_URL="your_supabase_url"
     VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
     ```
   - Start the development server:
     ```bash
     npm run dev
     ```
   - Open the link shown in the terminal (usually `http://localhost:5173`).

## Features
- **Instant Search**: Real-time filtering by category and keywords.
- **Smart Listings**: AI assists students in writing persuasive descriptions.
- **WhatsApp Integration**: Direct buyer-to-seller communication.
- **Student Verification**: Secure registration restricted to `@students.dkut.ac.ke` emails.
