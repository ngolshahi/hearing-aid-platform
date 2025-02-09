# Hearing Aid Platform

This project is a **Progressive Web App (PWA)** that allows users to view and select hearing aids, take tests, and book consultations with audiologists. It also includes a backend built with **Ktor** and **Azure Cosmos DB** for managing user data and services.

---

## Table of Contents

- [Requirements](#requirements)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)

---

## Requirements

Before setting up the project, ensure that you have the following installed on your local machine:

1. **Node.js** (for frontend)
2. **Kotlin** (for backend)
3. **JDK 11 or higher** (for backend)
4. **Azure account** (for Cosmos DB)
5. **Firebase account** (for Firebase services)

---

## Clone the repository

```bash
git clone https://github.com/ngolshahi/hearing-aid-platform.git
cd hearing-aid-platform/backend
```

## Backend Setup

### 1. Install dependencies

In the backend directory, you will need to install the necessary dependencies.

Run the following command to install required dependencies and build the project:

```bash
./gradlew build
```

### 2. Configure environment variables

Create a .env file in the root directory of your backend project and add your Azure Cosmos DB credentials.

Example .env file for backend:

```bash
AZURE_COSMOS_DB_URI=your_cosmos_db_uri
AZURE_COSMOS_DB_KEY=your_cosmos_db_key
AZURE_COSMOS_DB_DATABASE=your_cosmos_db_name
AZURE_COSMOS_DB_CONTAINER=your_cosmos_db_container_name
```

### 3. Start the backend

To run the backend server, execute the following:

```bash
./gradlew run
```
This will start the Ktor backend on ```http://localhost:8080```.


## Frontend Setup

### 1. Install dependencies

In the frontend directory, run the following command to install the necessary Node.js dependencies:

```bash
npm install
```

### 2. Configure environment variables

Create a .env file in the root directory of your frontend project and add your Firebase credentials.

Example .env file for frontend:

```bash
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

### 3. Start the frontend

To start the frontend application in development mode, run the following command:

```bash
npm run dev
```

This will start the React app on http://localhost:5173.

## Running the Application

Start the backend: Run ```./gradlew run``` in the backend directory to start your Ktor server.

Start the frontend: Run ```npm run dev``` in the frontend directory to start the React development server.

## Troubleshooting

- Backend not starting: Make sure all environment variables are set properly in the .env file.

- Frontend not loading: Check if the React development server is running by visiting ```http://localhost:5173```. Ensure there are no errors in the browser console.

- Database connection issues: Verify your Azure Cosmos DB credentials and ensure the database is accessible.





