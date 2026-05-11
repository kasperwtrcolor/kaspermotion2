<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# KasperMotion Cinematic Engine

KasperMotion is an advanced AI-powered video production platform designed to transform websites, product descriptions, or raw scripts into high-impact cinematic choreography. By combining the reasoning power of Google Gemini with a high-performance React-based rendering engine, KasperMotion automates the entire creative pipeline—from scriptwriting and scene direction to final video export.

## 🚀 Key Features

- **AI Director**: Leverages Gemini 1.5 to analyze URLs or text and generate intelligent scene choreography, typography choices, and camera paths.
- **Dynamic Kinetic Typography**: Premium text animations with multiple themes (Brutal, Glass, Neon, etc.) and layout options.
- **Spatial 3D Navigation**: A unique 3D world engine that moves a virtual camera through "composition nodes" for a truly cinematic feel.
- **Automated Asset Sourcing**: Integrated scraping logic to pull images directly from source URLs to use as scene backgrounds or overlays.
- **Studio-Grade Export**: Client-side screen recording with synchronized audio capture for high-quality WebM/MP4 output.
- **Storage Management**: Built-in 500MB user quota system to manage cloud resources effectively.

## 🛠 Tech Stack

- **Frontend**: React, Framer Motion, GSAP, Tailwind CSS
- **AI**: Google Gemini Pro 1.5
- **Backend**: Node.js, Express, Firebase Firestore/Storage
- **Rendering**: Remotion-inspired custom canvas architecture

## ## Run Locally

**Prerequisites:** Node.js (v18+)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kasperwtrcolor/kaspermotion2.git
   cd kaspermotion2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file and add your keys:
   - `GEMINI_API_KEY`: Your Google AI Studio key
   - `REPLICATE_API_TOKEN`: For AI image/video generation (optional)
   - `FIREBASE_CONFIG`: For storage and user data

4. **Run the app**:
   ```bash
   npm run dev
   ```

---
View your app in AI Studio: [KasperMotion AI Studio](https://ai.studio/apps/05e7b484-8619-4800-9e84-75b7d72457cd)
