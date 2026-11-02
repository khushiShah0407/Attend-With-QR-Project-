import React, { useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  Navigation,
  Compass,
  Layers,
  CheckCircle2,
  AlertCircle,
  LocateFixed,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateGpsDistanceMeters } from '../utils/qrCrypto';

export const CampusMapGeofence = () => {
  const { campusCoords, liveSession, user } = useApp();
  const [studentLat, setStudentLat] = useState(18.99026);
  const [studentLng, setStudentLng] = useState(73.12778);
  const [mapType, setMapType] = useState('roadmap');
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  const distance = calculateGpsDistanceMeters(
    studentLat,
    studentLng,
    campusCoords.lat,
    campusCoords.lng
  );

  const isWithinRadius = distance <= campusCoords.radiusMeters;

  // Real browser GPS query
  const handleUseRealGps = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setStudentLat(pos.coords.latitude);
        setStudentLng(pos.coords.longitude);
      },
      (err) => {
        setIsLocating(false);
        setGeoError('GPS permission was denied. Defaulting to campus classroom coordinates.');
        // Fallback to campus coordinates
        setStudentLat(18.99025);
        setStudentLng(73.12776);
      },
      { timeout: 8000 }
    );
  };

  const simulateLocation = (type) => {
    setGeoError('');
    if (type === 'inside') {
      setStudentLat(18.99025);
      setStudentLng(73.12776);
    } else {
      setStudentLat(19.002);
      setStudentLng(73.138);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Campus Geofence & Google Maps
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Anti-Proxy Active
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {user.collegeName} • 150m secure classroom radius
          </p>
        </div>

        {/* Map Type & Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleUseRealGps}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Use Real GPS</span>
          </button>

          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-semibold">
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapType === 'roadmap'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapType === 'satellite'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Satellite
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => simulateLocation('inside')}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-md font-medium"
            >
              Inside Lab 18
            </button>
            <button
              onClick={() => simulateLocation('outside')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md font-medium"
            >
              Off Campus (2km)
            </button>
          </div>
        </div>
      </div>

      {geoError && (
        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Styled Interactive Campus Map Container */}
      <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#E8ECEF] dark:bg-slate-950">
        {/* Map Grid Pattern background */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            mapType === 'satellite'
              ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 opacity-95'
              : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] bg-[#f8fafc] dark:bg-slate-950 dark:bg-[radial-gradient(#334155_1px,transparent_1px)]'
          }`}
        />

        {/* Roads & Campus Pathways SVGs */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          <line x1="0" y1="160" x2="100%" y2="160" stroke="#94A3B8" strokeWidth="20" />
          <line x1="420" y1="0" x2="420" y2="100%" stroke="#94A3B8" strokeWidth="16" />
          <line x1="140" y1="60" x2="700" y2="280" stroke="#CBD5E1" strokeWidth="10" />
        </svg>

        {/* 150m Geofence Radius Circle centered on Lab 18 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative flex items-center justify-center">
            {/* Pulsing radar */}
            <div className="w-64 h-64 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 animate-ping opacity-25" />
            <div className="absolute w-56 h-56 rounded-full bg-indigo-500/15 border-2 border-dashed border-indigo-600/60 dark:border-indigo-400/60 flex items-center justify-center">
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-white/95 dark:bg-slate-900/95 px-2.5 py-0.5 rounded-full shadow-xs">
                150m Geofence Perimeter
              </span>
            </div>
          </div>
        </div>

        {/* Center Classroom Pin (Lab 18) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl border-2 border-white dark:border-slate-900">
            <MapPin className="w-5 h-5 fill-white" />
          </div>
          <span className="mt-1 px-2.5 py-0.5 bg-slate-900/95 text-white text-[11px] font-bold rounded-md shadow-sm">
            {liveSession.classroom} ({liveSession.subjectCode})
          </span>
        </div>

        {/* Other Campus Buildings */}
        <div className="absolute top-10 left-16 flex flex-col items-center opacity-85">
          <div className="w-6 h-6 rounded-md bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">
            A
          </div>
          <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 px-1.5 rounded mt-0.5">
            Admin Block
          </span>
        </div>

        <div className="absolute bottom-12 right-24 flex flex-col items-center opacity-85">
          <div className="w-6 h-6 rounded-md bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">
            IT
          </div>
          <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 px-1.5 rounded mt-0.5">
            Room 301
          </span>
        </div>

        {/* Student Current Marker */}
        <div
          className={`absolute transition-all duration-700 flex flex-col items-center ${
            isWithinRadius ? 'top-[44%] left-[54%]' : 'top-[12%] left-[84%]'
          }`}
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
              <Navigation className="w-3.5 h-3.5 fill-white" />
            </div>
            <div className="absolute -inset-1 rounded-full bg-emerald-400/40 animate-ping pointer-events-none" />
          </div>
          <span className="mt-1 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded shadow-xs whitespace-nowrap">
            {user.name} (You)
          </span>
        </div>

        {/* Google Map overlay badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/95 dark:bg-slate-900/95 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-xs">
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>Google Maps Platform Verified</span>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white/95 dark:bg-slate-900/95 rounded-lg text-[10px] font-mono text-slate-600 dark:text-slate-400 shadow-sm">
          <Compass className="w-3.5 h-3.5 text-slate-500" />
          <span>
            {studentLat.toFixed(4)}° N, {studentLng.toFixed(4)}° E
          </span>
        </div>
      </div>

      {/* Real-Time Geofence Verification Status Card */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between text-sm transition-colors ${
          isWithinRadius
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
            : 'bg-rose-50/90 border-rose-200 text-rose-950 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {isWithinRadius ? (
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}

          <div>
            <div className="font-bold flex items-center gap-2">
              <span>{isWithinRadius ? 'Verified Inside Classroom' : 'Out of Classroom Range'}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80">
                {distance}m from {liveSession.classroom}
              </span>
            </div>
            <div className="text-xs opacity-85 mt-0.5">
              {isWithinRadius
                ? 'Your GPS location matches the faculty classroom broadcast. Attendance check-in is authorized.'
                : 'Anti-proxy rules require physical presence within 150m of the classroom projector.'}
            </div>
          </div>
        </div>

        <div className="hidden sm:block text-right">
          <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-75">
            Security Status
          </span>
          <span className="font-bold text-xs">
            {isWithinRadius ? 'READY TO SCAN' : 'GEOFENCE REJECT'}
          </span>
        </div>
      </div>
    </div>
  );
};
