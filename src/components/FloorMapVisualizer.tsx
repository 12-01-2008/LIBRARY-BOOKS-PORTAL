import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Layers, 
  Compass, 
  Info, 
  CornerDownRight, 
  CheckCircle,
  Building
} from 'lucide-react';
import { ShelfLocation } from '../types/library';

interface FloorMapVisualizerProps {
  shelfLocation: ShelfLocation;
  bookTitle?: string;
}

export const FloorMapVisualizer: React.FC<FloorMapVisualizerProps> = ({
  shelfLocation,
  bookTitle
}) => {
  const [activeFloor, setActiveFloor] = useState<number>(shelfLocation.floor || 2);

  // Sync floor if prop updates
  React.useEffect(() => {
    if (shelfLocation.floor) {
      setActiveFloor(shelfLocation.floor);
    }
  }, [shelfLocation.floor]);

  const isCurrentFloorOfBook = activeFloor === shelfLocation.floor;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 overflow-hidden">
      
      {/* Floor navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-200">Library Floor Map</span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            Main Campus Tower
          </span>
        </div>

        {/* Floor selector buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {[1, 2, 3].map((floorNum) => (
            <button
              key={floorNum}
              onClick={() => setActiveFloor(floorNum)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all relative ${
                activeFloor === floorNum
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Floor {floorNum}
              {shelfLocation.floor === floorNum && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border-2 border-slate-950 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Map Layout */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 flex flex-col justify-between overflow-hidden">
        
        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', 
            backgroundSize: '16px 16px' 
          }} 
        />

        {/* Map Top Labels */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>North Wing (Quiet Zones)</span>
          </div>
          <div className="text-slate-400 font-mono">
            {activeFloor === 1 && 'Floor 1: Humanities, Math & Circulation'}
            {activeFloor === 2 && 'Floor 2: Computer Science, Engineering & AI'}
            {activeFloor === 3 && 'Floor 3: Bio-Sciences, Medicine & Archives'}
          </div>
        </div>

        {/* Dynamic Floor Architecture Visualization */}
        <div className="relative z-10 my-auto py-2 grid grid-cols-4 gap-2 sm:gap-3">
          
          {/* Section A: Study & Circulation Desk */}
          <div className="col-span-1 h-24 sm:h-28 rounded-lg border border-dashed border-slate-700 bg-slate-800/40 p-2 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {activeFloor === 1 ? 'Help Desk & Reserves' : 'Stairs & Elevator'}
            </span>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Entrance Portal
            </div>
          </div>

          {/* Section B: Aisle Shelves 1-4 */}
          <div className={`col-span-2 h-24 sm:h-28 rounded-xl border p-2 relative flex flex-col justify-between transition-all ${
            isCurrentFloorOfBook 
              ? 'border-indigo-500/50 bg-indigo-950/20' 
              : 'border-slate-800 bg-slate-800/20'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300">
                {activeFloor === 2 ? 'Tech & Engineering Stacks' : activeFloor === 1 ? 'Math & Arts Stacks' : 'Bio-Med Stacks'}
              </span>
              {isCurrentFloorOfBook && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  Target Zone
                </span>
              )}
            </div>

            {/* Aisle representation */}
            <div className="grid grid-cols-4 gap-1.5">
              {['01', '02', '03', '04'].map((aisle) => {
                const isTargetAisle = isCurrentFloorOfBook && shelfLocation.shelf_code.includes(aisle);
                return (
                  <div
                    key={aisle}
                    className={`h-10 rounded-md flex flex-col items-center justify-center text-[10px] font-mono border transition-all ${
                      isTargetAisle
                        ? 'bg-indigo-600 text-white font-bold border-indigo-400 shadow-md shadow-indigo-500/40 ring-2 ring-indigo-400/50'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    <span>Aisle {aisle}</span>
                    {isTargetAisle && (
                      <motion.div 
                        animate={{ scale: [1, 1.25, 1] }} 
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-0.5"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Shelf Rows A - D</span>
              {isCurrentFloorOfBook && (
                <span className="text-indigo-300 font-semibold">Exact Shelf: {shelfLocation.shelf_code}</span>
              )}
            </div>
          </div>

          {/* Section C: Collaborative Pods & Study Hall */}
          <div className="col-span-1 h-24 sm:h-28 rounded-lg border border-slate-800 bg-slate-800/40 p-2 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Reading Cubicles
            </span>
            <div className="text-[10px] text-slate-400">
              Silent Zone 0{activeFloor}
            </div>
          </div>

        </div>

        {/* Map Bottom Legend */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 border border-indigo-400" />
              <span className="text-slate-300 font-medium">Book Location</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700" />
              <span className="text-slate-400">Other Stacks</span>
            </div>
          </div>

          <div className="text-slate-400 font-mono text-[10px]">
            GPS / Indoor Beacon Sync Active
          </div>
        </div>

      </div>

      {/* Step-by-Step Walking Directions */}
      <div className="mt-4 p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Navigation className="w-3.5 h-3.5 text-sky-400" />
          <span>Walking Route to Physical Shelf:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300">
          <div className="flex items-start gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
            <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
            <div>
              <p className="font-semibold text-white">Elevator / Central Stairs</p>
              <p className="text-[11px] text-slate-400">Proceed to Level {shelfLocation.floor}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
            <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
            <div>
              <p className="font-semibold text-white">{shelfLocation.wing}</p>
              <p className="text-[11px] text-slate-400">{shelfLocation.section}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
            <div>
              <p className="font-semibold text-amber-300">Shelf {shelfLocation.shelf_code}</p>
              <p className="text-[11px] text-slate-400 font-mono">Call: {shelfLocation.call_number}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
