# Open Source Satellite Tracker

A real-time satellite tracking application that visualizes satellites in orbit using 3D Earth representation.

![Satellite Tracker](/public/images/sattracker.png)

## About the Creator

This project was created by Ratnesh Kumar, a self-taught developer who learned to code through personal dedication and passion for space technology. Building this satellite tracker represents the culmination of independent learning and practical application of modern web technologies to create a useful tool for space enthusiasts.

## Features

- Real-time tracking of satellites using TLE data
- 3D visualization with CesiumJS
- Orbital mechanics calculations with satellite.js
- Filter satellites by type, country, and other attributes
- Display satellite information and orbital parameters

## Technologies

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Visualization:** CesiumJS
- **Orbital Mechanics:** satellite.js

## Getting Started

### Prerequisites

- Node.js 16.8.0 or newer
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Ratz-innovator/Sat-tracker-.git
   cd Sat-tracker-
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `src/app`: Next.js App Router pages
- `src/components`: Reusable UI components
- `src/components/cesium`: Cesium-specific components
- `src/hooks`: Custom React hooks
- `src/lib`: Core utilities and satellite.js wrappers
- `public`: Static assets including Cesium assets

## License

This project is open source and available under the [MIT License](LICENSE). 