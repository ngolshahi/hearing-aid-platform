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
AZURE_COSMOS_DB_URI="https://hearing-aid-db.documents.azure.com:443/"
AZURE_COSMOS_DB_KEY="16P2pkpvoifBx2vOzWaeIFl4WjSM8pJdazbNqZLJtHRjDuQn0NFTXMpuWlGghCr0PSjePwNPKLu9ACDblTd15Q=="
AZURE_COSMOS_DB_DATABASE="HearingAidDB"
USERS_CONTAINER="users"
HEARING_AID_CONTAINER="hearingAids"
APPOINTMENTS_CONTAINER="appointments"
AUDIOLOGISTS_CONTAINER="audiologists"
APPOINTMENT_TYPES_CONTAINER="appointmentTypes"
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

# Hearing Aid AR Try-On Experience

This feature allows users to try on hearing aids virtually, both in real-time using their mobile device camera and by uploading photos on desktop.

## Features

- **Mobile Real-time AR**: On mobile devices, users can use their camera to see in real-time how hearing aids would look on their ear
- **Desktop Image Upload**: On desktop, users can upload ear photos and see how the hearing aid would look
- **Multiple Hearing Aid Models**: Compatible with various hearing aid models and styles
- **Color Visualization**: Shows the hearing aid in different available colors

## Setup Requirements

### Frontend

The frontend AR implementation uses the following technologies:
- Web browser's camera access APIs
- Canvas-based image manipulation
- REST API calls to the backend for image processing

### Backend

The backend AR processing requires the following setup:

1. **Azure Computer Vision API** (Optional but recommended for better ear detection)
   - Sign up for Azure Computer Vision at https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/
   - Create a Computer Vision resource in the Azure portal
   - Note your API key and endpoint URL

2. **Environment Variables**
   - Update the `.env` file in the backend directory with your Azure credentials:
   ```
   AZURE_VISION_KEY="your-vision-api-key"
   AZURE_VISION_ENDPOINT="https://your-vision-service.cognitiveservices.azure.com/"
   ```

3. **Restart Backend**
   - After setting the environment variables, restart your backend service to apply the changes

## Implementation Details

### Mobile AR Implementation

The mobile AR implementation uses real-time video processing with ear detection:

1. Camera feed is captured using the device camera
2. Each video frame is processed to detect the user's ear
3. A hearing aid overlay is positioned and rendered based on the ear position
4. Users can switch between front and back cameras and capture snapshots

### Desktop Image Processing

The desktop implementation processes uploaded ear images:

1. User uploads an image of their ear
2. The image is sent to the backend for processing
3. The backend detects the ear position using either Azure Computer Vision or a color-based algorithm
4. A hearing aid is overlaid on the ear based on the detected position
5. The processed image is returned to the frontend for display

### Ear Detection Methods

The AR implementation uses two ear detection approaches:

1. **Azure Computer Vision API** (if credentials are provided)
   - Uses machine learning to detect ears in the image
   - More accurate across different lighting conditions and ear types

2. **Color-based Detection** (fallback method)
   - Uses skin color detection to find ear-like regions
   - Works for basic scenarios but less accurate than AI-based detection

## Usage

1. Navigate to a hearing aid product page
2. Click the "Try On with AR" button
3. On mobile:
   - Grant camera permissions
   - Position your ear in the center of the frame
   - The hearing aid will be overlaid in real-time
   - Use the "Switch Camera" button to change camera
   - Use the "Capture" button to save an image

4. On desktop:
   - Click to upload a photo of your ear
   - Wait for processing to complete
   - View the before/after comparison
   - Download the processed image if desired
