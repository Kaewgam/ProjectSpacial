# Alumni System (Project Spacial)

A comprehensive Alumni Management System built with modern web technologies, designed to connect graduates, share knowledge, and manage alumni networks effectively.

## 🌟 Features

- **Authentication System**: Secure login, registration, and password reset functionalities.
- **News & Announcements**: Admins can post and manage news, and pin important announcements to the top of the feed.
- **Hall of Fame**: Showcase outstanding alumni and their achievements.
- **Alumni Directory & Search**: Advanced search functionality to find alumni by name, faculty, department, or skills.
- **Interactive Profiles**: Detailed alumni profiles including education history, work experience, skills, and certificates.
- **Knowledge Sharing Board**: A community forum where users can create threads, share insights, and engage in discussions through comments.
- **Graph Visualization**: Interactive 2D graph view to visualize relationships and connections between alumni (powered by Neo4j).
- **Admin Dashboard**: Comprehensive management interface for users, posts, hall of fame entries, and database synchronization.

## 💻 Technology Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/) & React Icons
- **Data Fetching**: Axios
- **Notifications**: React Hot Toast
- **Visualization**: React Force Graph 2D

### Backend
- **Framework**: Django REST Framework (Python)
- **Databases**: 
  - Primary Relational Database (e.g., PostgreSQL/SQLite)
  - **Neo4j** (Graph Database for alumni connection visualization)
- **Storage**: Cloudinary (for image/media storage)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.10 or higher)
- Neo4j Database
- PostgreSQL / SQLite

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the `frontend` directory and add your API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

### Backend Setup

1. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables based on `.env.example`.

4. Apply migrations:
   ```bash
   python manage.py migrate
   ```

5. Run the Django development server:
   ```bash
   python manage.py runserver
   ```

## 🛠️ Scripts & Utilities

The project includes several utility scripts in the root directory for database management, migration, and Neo4j synchronization (e.g., `sync_neo4j.py`, `check_db.py`, `upload_to_cloudinary.py`). Run these as needed for maintenance.

## 📄 License

This project is licensed under the MIT License.
