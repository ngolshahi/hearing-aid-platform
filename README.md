# Hearing Aid Platform

This project is a **web application** that also functions as a **Progressive Web App (PWA)**, providing an augmented reality experience for visualizing hearing aids. The platform allows users to view hearing aid models in their real environment using AR technology, with support for both iOS Quick Look and WebXR standards. Users can access the platform through any modern web browser, with the option to install it as a PWA for an enhanced mobile experience.

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)

---

## Features

### Platform Access
- **Web Application**: Access through any modern web browser
- **Progressive Web App**: Installable on mobile devices for a native app-like experience
- **Offline Support**: Basic functionality available without internet connection (PWA feature)
- **Cross-Platform Compatibility**: Works on desktop and mobile browsers

### Augmented Reality Experience
- **iOS Quick Look**: On iOS devices, users can view hearing aids in their environment using Apple's Quick Look AR
- **WebXR Support**: On compatible devices, users can experience AR through the WebXR standard
- **3D Model Viewer**: For devices without AR support, users can interact with detailed 3D models of hearing aids
- **Multiple Color Options**: Visualization of hearing aids in different available colors
- **Real-time Environment Integration**: Place and view hearing aids in your actual surroundings

### Technical Features
- **Cross-Platform Support**: 
  - iOS: Native AR experience via Quick Look
  - Android/Desktop: WebXR implementation
  - Fallback: Interactive 3D model viewer
- **Responsive Design**: Adapts to different screen sizes and device capabilities
- **High-Quality 3D Models**: Detailed hearing aid models with accurate textures and materials
- **Device Compatibility Detection**: Automatically selects the best viewing experience based on device capabilities

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
AZURE_COSMOS_DB_URI="your_cosmos_db_uri"
AZURE_COSMOS_DB_KEY="your_cosmos_db_key"
AZURE_COSMOS_DB_DATABASE="HearingAidDB"
USERS_CONTAINER="users"
HEARING_AID_CONTAINER="hearingAids"
APPOINTMENTS_CONTAINER="appointments"
AUDIOLOGISTS_CONTAINER="audiologists"
APPOINTMENT_TYPES_CONTAINER="appointmentTypes"

# Optional: For enhanced ear detection
AZURE_VISION_KEY="your_vision_api_key"
AZURE_VISION_ENDPOINT="your_vision_endpoint"
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

### iOS AR Experience
1. Navigate to a hearing aid product page
2. Click the "View in AR" button
3. The Quick Look AR viewer will open
4. Point your camera at a flat surface
5. Tap to place the hearing aid model
6. Move around to view the hearing aid from different angles
7. Use gestures to rotate and scale the model

### WebXR Experience (Android/Desktop)
1. Navigate to a hearing aid product page
2. Click the "View in AR" button
3. Grant camera permissions when prompted
4. Point your camera at a flat surface
5. Tap to place the hearing aid model
6. Move around to view the hearing aid from different angles
7. Use touch/mouse gestures to interact with the model

### 3D Model Viewer (Non-AR Devices)
1. Navigate to a hearing aid product page
2. Click the "View 3D Model" button
3. The 3D model viewer will open
4. Use mouse/touch controls to:
   - Rotate the model
   - Zoom in/out
   - Pan the view
5. Select different colors to see various style options

### Tips for Best Results
- Ensure good lighting for better AR tracking
- Use a flat, well-textured surface for model placement
- Keep your device steady while placing the model
- For the best AR experience, use a modern iOS device or WebXR-compatible browser
- The 3D model viewer works on all devices and provides a high-quality alternative
