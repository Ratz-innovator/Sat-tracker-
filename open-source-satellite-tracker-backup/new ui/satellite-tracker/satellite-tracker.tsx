"use client"

import { useState, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars, Html } from "@react-three/drei"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  AlertCircle,
  Github,
  Globe,
  Info,
  Layers,
  Menu,
  Moon,
  Rocket,
  Satellite,
  Search,
  Settings,
  Twitter,
  User,
} from "lucide-react"

// Sample satellite data
const satellites = [
  { id: 1, name: "ISS", type: "Space Station", lat: 40, lng: -75, altitude: 408 },
  { id: 2, name: "Starlink-1234", type: "Starlink", lat: 35, lng: 139, altitude: 550 },
  { id: 3, name: "Hubble", type: "Telescope", lat: -33, lng: 18, altitude: 540 },
  { id: 4, name: "NOAA-19", type: "Weather", lat: 51, lng: 10, altitude: 870 },
  { id: 5, name: "Debris-A", type: "Debris", lat: 37, lng: -122, altitude: 780 },
]

function Earth(props) {
  const earthRef = useRef()

  useFrame(({ clock }) => {
    earthRef.current.rotation.y = clock.getElapsedTime() * 0.05
  })

  return (
    <group {...props}>
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial color="#1e40af" emissive="#172554" specular="#60a5fa" shininess={5} />
        {/* Continents approximation with a second sphere */}
        <mesh>
          <sphereGeometry args={[1.01, 32, 32]} />
          <meshBasicMaterial color="#2563eb" wireframe={true} transparent={true} opacity={0.3} />
        </mesh>
      </mesh>
    </group>
  )
}

function SatelliteMarker({ lat, lng, altitude, name, selected }) {
  // Convert lat/lng to 3D coordinates
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const radius = 1 + altitude / 6371 // Earth radius in km

  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[0.01, 16, 16]} />
      <meshBasicMaterial color={selected ? "#3b82f6" : "#60a5fa"} />
      {selected && (
        <Html distanceFactor={10}>
          <div className="bg-black/80 text-blue-400 px-2 py-1 rounded text-xs whitespace-nowrap">
            {name} ({Math.round(altitude)}km)
          </div>
        </Html>
      )}
    </mesh>
  )
}

export default function SatelliteTracker() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedSatellite, setSelectedSatellite] = useState(null)
  const [filters, setFilters] = useState({
    starlink: true,
    iss: true,
    debris: true,
    other: true,
  })

  const toggleFilter = (filter) => {
    setFilters((prev) => ({ ...prev, [filter]: !prev[filter] }))
  }

  const filteredSatellites = satellites.filter((sat) => {
    if (sat.type === "Starlink" && !filters.starlink) return false
    if (sat.type === "Space Station" && !filters.iss) return false
    if (sat.type === "Debris" && !filters.debris) return false
    if (!["Starlink", "Space Station", "Debris"].includes(sat.type) && !filters.other) return false
    return true
  })

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Navbar */}
      <header className="border-b border-blue-900/40 bg-black/90 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <div className="flex items-center gap-2">
            <Satellite className="h-6 w-6 text-blue-500" />
            <h1 className="text-xl font-bold tracking-tighter">SatTrack</h1>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="relative hidden md:flex">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-500" />
              <Input
                type="search"
                placeholder="Search satellites..."
                className="w-[200px] lg:w-[300px] bg-blue-950/20 border-blue-900/50 pl-9 text-sm"
              />
            </div>

            <Button variant="ghost" size="icon" className="text-blue-500">
              <Settings className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="text-blue-500">
              <Moon className="h-5 w-5" />
            </Button>

            <Button variant="outline" className="hidden md:flex border-blue-900/50 text-blue-400 hover:text-blue-300">
              <User className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 z-50 flex w-72 flex-col border-r border-blue-900/40 bg-black/90 backdrop-blur-sm pt-16 transition-transform duration-300 md:relative md:translate-x-0`}
        >
          <div className="flex flex-1 flex-col overflow-auto p-4">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-blue-400 flex items-center">
                <Layers className="mr-2 h-5 w-5" />
                Satellite Filters
              </h2>
              <p className="text-xs text-blue-300/70 mt-1">Toggle satellite types to display</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Rocket className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="starlink" className="text-sm">
                    Starlink
                  </Label>
                </div>
                <Switch
                  id="starlink"
                  checked={filters.starlink}
                  onCheckedChange={() => toggleFilter("starlink")}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="iss" className="text-sm">
                    ISS & Space Stations
                  </Label>
                </div>
                <Switch
                  id="iss"
                  checked={filters.iss}
                  onCheckedChange={() => toggleFilter("iss")}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="debris" className="text-sm">
                    Space Debris
                  </Label>
                </div>
                <Switch
                  id="debris"
                  checked={filters.debris}
                  onCheckedChange={() => toggleFilter("debris")}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Satellite className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="other" className="text-sm">
                    Other Satellites
                  </Label>
                </div>
                <Switch
                  id="other"
                  checked={filters.other}
                  onCheckedChange={() => toggleFilter("other")}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>

            <Separator className="my-6 bg-blue-900/40" />

            <div className="mb-4">
              <h2 className="text-lg font-semibold text-blue-400 flex items-center">
                <Info className="mr-2 h-5 w-5" />
                Altitude Range
              </h2>
              <p className="text-xs text-blue-300/70 mt-1 mb-4">Filter satellites by altitude (km)</p>

              <Slider defaultValue={[0, 1000]} max={1000} step={10} className="my-6" />

              <div className="flex justify-between text-xs text-blue-300/70">
                <span>0 km</span>
                <span>1000 km</span>
              </div>
            </div>

            <Separator className="my-6 bg-blue-900/40" />

            <div>
              <h2 className="text-lg font-semibold text-blue-400 mb-3">Active Satellites</h2>
              <div className="space-y-2 max-h-60 overflow-auto pr-2">
                {filteredSatellites.map((sat) => (
                  <div
                    key={sat.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                      selectedSatellite === sat.id ? "bg-blue-900/40 border border-blue-500/50" : "hover:bg-blue-950/30"
                    }`}
                    onClick={() => setSelectedSatellite(sat.id === selectedSatellite ? null : sat.id)}
                  >
                    <div>
                      <div className="font-medium text-sm">{sat.name}</div>
                      <div className="text-xs text-blue-300/70">{sat.altitude} km</div>
                    </div>
                    <Badge variant="outline" className="text-xs border-blue-900/50 text-blue-400">
                      {sat.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden relative">
          {/* 3D Earth Canvas */}
          <Canvas className="w-full h-full">
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Earth position={[0, 0, 0]} />

            {filteredSatellites.map((sat) => (
              <SatelliteMarker
                key={sat.id}
                lat={sat.lat}
                lng={sat.lng}
                altitude={(sat.altitude / 6371) * 0.2} // Scale for visualization
                name={sat.name}
                selected={selectedSatellite === sat.id}
              />
            ))}

            <OrbitControls
              enableZoom={true}
              enablePan={true}
              enableRotate={true}
              zoomSpeed={0.6}
              panSpeed={0.5}
              rotateSpeed={0.5}
            />
          </Canvas>

          {/* Info card */}
          {selectedSatellite && (
            <Card className="absolute bottom-20 right-4 w-72 bg-black/80 border-blue-900/60 text-white backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-blue-400">
                    {satellites.find((s) => s.id === selectedSatellite)?.name}
                  </h3>
                  <Badge variant="outline" className="text-xs border-blue-900/50 text-blue-400">
                    {satellites.find((s) => s.id === selectedSatellite)?.type}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-300/70">Altitude:</span>
                    <span>{satellites.find((s) => s.id === selectedSatellite)?.altitude} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300/70">Latitude:</span>
                    <span>{satellites.find((s) => s.id === selectedSatellite)?.lat}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300/70">Longitude:</span>
                    <span>{satellites.find((s) => s.id === selectedSatellite)?.lng}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300/70">Velocity:</span>
                    <span>7.8 km/s</span>
                  </div>
                </div>

                <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white">Track in Real-time</Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-blue-900/40 bg-black/90 backdrop-blur-sm py-4 px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-blue-300/70">
            Data provided by <span className="text-blue-400">Space-Track.org</span> and{" "}
            <span className="text-blue-400">NASA J-Track</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-400 hover:bg-blue-950/30">
              <Twitter className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-400 hover:bg-blue-950/30">
              <Github className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-400 hover:bg-blue-950/30">
              <Globe className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-xs text-blue-300/70">© 2025 SatTrack. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
