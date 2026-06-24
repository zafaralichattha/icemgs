import { useState, useEffect } from 'react';
import { useProject, FloorDetail } from '../../contexts/ProjectContext';
import { Home, Plus, Minus, AlertTriangle } from 'lucide-react';

interface StepRoomDetailsProps {
  onNext: () => void;
}

// Predefined room types
const COUNTABLE_ROOMS = [
  { id: 'bedroom', label: 'Bedrooms', icon: '🛏️' },
  { id: 'bathroom', label: 'Bathrooms', icon: '🚿' },
];

const SINGLE_ROOMS = [
  { id: 'kitchen', label: 'Kitchen', icon: '🍳', required: true },
  { id: 'lounge', label: 'Lounge', icon: '📺', required: true },
  { id: 'store', label: 'Store Room', icon: '📦' },
  { id: 'terrace', label: 'Terrace', icon: '🌿' },
  { id: 'balcony', label: 'Balcony', icon: '🪴' },
  { id: 'mumty', label: 'Mumty', icon: '🏠' },
];

const ALL_ROOM_TYPES = [...COUNTABLE_ROOMS, ...SINGLE_ROOMS, { id: 'drawing', label: 'Drawing Room', icon: '🛋️' }, { id: 'dining', label: 'Dining Room', icon: '🍽️' }];

interface RoomCount {
  [key: string]: number;
}

// Calculate approximate room area based on size and plot marlas
function getRoomArea(size: 'small' | 'medium' | 'large', type?: string, combineDrawingDining?: boolean, plotMarlas: number = 5): number {
  // Scaling factor based on plot size: 5 Marla is base (1.0), 10 Marla is medium (1.25), 20 Marla is large (1.5)
  let scale = 1.0;
  if (plotMarlas > 5 && plotMarlas <= 10) {
    scale = 1.25;
  } else if (plotMarlas > 10) {
    scale = 1.5;
  } else if (plotMarlas < 5) {
    scale = 0.85;
  }

  if (type === 'drawing' && combineDrawingDining) {
    switch(size) {
      case 'small': return Math.round(240 * scale); // 12×20 ft combined base
      case 'medium': return Math.round(336 * scale); // 14×24 ft combined base
      case 'large': return Math.round(448 * scale); // 16×28 ft combined base
      default: return Math.round(336 * scale);
    }
  }
  
  switch(type) {
    case 'bedroom':
      return size === 'small' ? Math.round(120 * scale) : size === 'medium' ? Math.round(168 * scale) : Math.round(224 * scale);
    case 'bathroom':
      return size === 'small' ? Math.round(35 * scale) : size === 'medium' ? Math.round(48 * scale) : Math.round(64 * scale);
    case 'kitchen':
      return size === 'small' ? Math.round(80 * scale) : size === 'medium' ? Math.round(120 * scale) : Math.round(168 * scale);
    case 'lounge':
      return size === 'small' ? Math.round(192 * scale) : size === 'medium' ? Math.round(252 * scale) : Math.round(320 * scale);
    case 'drawing':
      return size === 'small' ? Math.round(168 * scale) : size === 'medium' ? Math.round(224 * scale) : Math.round(288 * scale);
    case 'dining':
      return size === 'small' ? Math.round(120 * scale) : size === 'medium' ? Math.round(168 * scale) : Math.round(224 * scale);
    case 'store':
      return size === 'small' ? Math.round(48 * scale) : size === 'medium' ? Math.round(80 * scale) : Math.round(100 * scale);
    case 'terrace':
      return size === 'small' ? Math.round(150 * scale) : size === 'medium' ? Math.round(300 * scale) : Math.round(500 * scale);
    case 'balcony':
      return size === 'small' ? Math.round(32 * scale) : size === 'medium' ? Math.round(50 * scale) : Math.round(72 * scale);
    case 'mumty':
      return 120;
    default:
      return size === 'small' ? Math.round(100 * scale) : size === 'medium' ? Math.round(168 * scale) : Math.round(224 * scale);
  }
}

function getSizeDescription(size: string, type?: string, combineDrawingDining?: boolean, plotMarlas: number = 5): string {
  // Scaling factor for dimensions
  let scale = 1.0;
  if (plotMarlas > 5 && plotMarlas <= 10) {
    scale = 1.25;
  } else if (plotMarlas > 10) {
    scale = 1.5;
  } else if (plotMarlas < 5) {
    scale = 0.85;
  }

  const w = (baseW: number) => Math.round(baseW * Math.sqrt(scale));
  const h = (baseH: number) => Math.round(baseH * Math.sqrt(scale));

  if (type === 'drawing' && combineDrawingDining) {
    switch(size) {
      case 'small': return `${w(12)}×${h(20)} ft (~${Math.round(240 * scale)} sq ft) - Compact combined space`;
      case 'medium': return `${w(14)}×${h(24)} ft (~${Math.round(336 * scale)} sq ft) - Standard formal space`;
      case 'large': return `${w(16)}×${h(28)} ft (~${Math.round(448 * scale)} sq ft) - Luxury formal space`;
      default: return '';
    }
  }
  
  switch(type) {
    case 'bedroom':
      return size === 'small' ? `${w(10)}×${h(12)} ft (~${Math.round(120 * scale)} sq ft)` : size === 'medium' ? `${w(12)}×${h(14)} ft (~${Math.round(168 * scale)} sq ft)` : `${w(14)}×${h(16)} ft (~${Math.round(224 * scale)} sq ft)`;
    case 'bathroom':
      return size === 'small' ? `${w(5)}×${h(7)} ft (~${Math.round(35 * scale)} sq ft)` : size === 'medium' ? `${w(6)}×${h(8)} ft (~${Math.round(48 * scale)} sq ft)` : `${w(8)}×${h(8)} ft (~${Math.round(64 * scale)} sq ft)`;
    case 'kitchen':
      return size === 'small' ? `${w(8)}×${h(10)} ft (~${Math.round(80 * scale)} sq ft)` : size === 'medium' ? `${w(10)}×${h(12)} ft (~${Math.round(120 * scale)} sq ft)` : `${w(12)}×${h(14)} ft (~${Math.round(168 * scale)} sq ft)`;
    case 'lounge':
      return size === 'small' ? `${w(12)}×${h(16)} ft (~${Math.round(192 * scale)} sq ft)` : size === 'medium' ? `${w(14)}×${h(18)} ft (~${Math.round(252 * scale)} sq ft)` : `${w(16)}×${h(20)} ft (~${Math.round(320 * scale)} sq ft)`;
    case 'drawing':
      return size === 'small' ? `${w(12)}×${h(14)} ft (~${Math.round(168 * scale)} sq ft)` : size === 'medium' ? `${w(14)}×${h(16)} ft (~${Math.round(224 * scale)} sq ft)` : `${w(16)}×${h(18)} ft (~${Math.round(288 * scale)} sq ft)`;
    case 'dining':
      return size === 'small' ? `${w(10)}×${h(12)} ft (~${Math.round(120 * scale)} sq ft)` : size === 'medium' ? `${w(12)}×${h(14)} ft (~${Math.round(168 * scale)} sq ft)` : `${w(14)}×${h(16)} ft (~${Math.round(224 * scale)} sq ft)`;
    case 'store':
      return size === 'small' ? `${w(6)}×${h(8)} ft (~${Math.round(48 * scale)} sq ft)` : size === 'medium' ? `${w(8)}×${h(10)} ft (~${Math.round(80 * scale)} sq ft)` : `${w(10)}×${h(10)} ft (~${Math.round(100 * scale)} sq ft)`;
    case 'terrace':
      return size === 'small' ? `${w(10)}×${h(15)} ft (~${Math.round(150 * scale)} sq ft)` : size === 'medium' ? `${w(15)}×${h(20)} ft (~${Math.round(300 * scale)} sq ft)` : `${w(20)}×${h(25)} ft (~${Math.round(500 * scale)} sq ft)`;
    case 'balcony':
      return size === 'small' ? `${w(4)}×${h(8)} ft (~${Math.round(32 * scale)} sq ft)` : size === 'medium' ? `${w(5)}×${h(10)} ft (~${Math.round(50 * scale)} sq ft)` : `${w(6)}×${h(12)} ft (~${Math.round(72 * scale)} sq ft)`;
    case 'mumty':
      return 'Standard Mumty Area (~120 sq ft)';
    default:
      return size === 'small' ? `${w(10)}×${h(10)} to ${w(10)}×${h(12)} ft (~${Math.round(100 * scale)} sq ft)` : size === 'medium' ? `${w(12)}×${h(14)} to ${w(14)}×${h(16)} ft (~${Math.round(168 * scale)} sq ft)` : `${w(16)}×${h(18)} ft and above (~${Math.round(224 * scale)}+ sq ft)`;
  }
}

export default function StepRoomDetails({ onNext }: StepRoomDetailsProps) {
  const { projectData, updateProjectData, markStepComplete } = useProject();
  const numberOfFloors = parseInt(projectData.plotDetails.numberOfFloors) || 1;
  const plotArea = parseFloat(projectData.plotDetails.plotArea) || 0;
  const [floors, setFloors] = useState<FloorDetail[]>([]);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [roomCounts, setRoomCounts] = useState<RoomCount[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [combineDrawingDining, setCombineDrawingDining] = useState(projectData.roomDetails.combineDrawingDining || false);

  const plotMarlas = parseFloat(projectData.plotDetails.plotMarlas) || 5;
  const getMaxRoomsPerFloor = (marlas: number) => {
    if (marlas < 5) return 3;
    if (marlas < 10) return 4;
    if (marlas < 20) return 6;
    return 10;
  };
  const maxRoomsPerFloor = getMaxRoomsPerFloor(plotMarlas);

  // Calculate usable area per floor (accounting for walls, circulation, etc.)
  const usableAreaPerFloor = plotArea * 0.65; // 65% of plot area is usable (35% for walls, stairs, circulation)
  const totalUsableArea = usableAreaPerFloor * numberOfFloors;

  // Initialize floors and room counts
  useEffect(() => {
    if (projectData.roomDetails.floors.length > 0) {
      setFloors(projectData.roomDetails.floors);
      
      // Initialize room counts from existing data
      const counts: RoomCount[] = [];
      projectData.roomDetails.floors.forEach(floor => {
        const floorCounts: RoomCount = {};
        ALL_ROOM_TYPES.forEach(type => {
          floorCounts[type.id] = floor.rooms.filter(r => r.type === type.id).length;
        });
        counts.push(floorCounts);
      });
      setRoomCounts(counts);
    } else {
      // Initialize empty floors and counts
      const initialFloors: FloorDetail[] = [];
      const initialCounts: RoomCount[] = [];
      
      for (let i = 0; i < numberOfFloors; i++) {
        const initialFloorRooms: { type: string, size: 'small' | 'medium' | 'large' }[] = [];
        
        if (i === 0) {
          initialFloorRooms.push({ type: 'kitchen', size: 'small' });
          initialFloorRooms.push({ type: 'lounge', size: 'small' });
          initialFloorRooms.push({ type: 'drawing', size: 'small' });
        }

        initialFloors.push({
          floorNumber: i + 1,
          rooms: initialFloorRooms
        });
        
        const floorCounts: RoomCount = {};
        ALL_ROOM_TYPES.forEach(type => {
          floorCounts[type.id] = 0;
        });
        if (i === 0) {
          floorCounts['kitchen'] = 1;
          floorCounts['lounge'] = 1;
          floorCounts['drawing'] = 1;
        }
        initialCounts.push(floorCounts);
      }
      
      setFloors(initialFloors);
      setRoomCounts(initialCounts);
    }
  }, []);

  const updateRoomCount = (floorIndex: number, roomType: string, increment: boolean) => {
    const newCounts = [...roomCounts];
    const currentCount = newCounts[floorIndex][roomType] || 0;
    
    if (increment) {
      newCounts[floorIndex][roomType] = currentCount + 1;
      
      // Add a new room with default 'small' size
      const newFloors = [...floors];
      newFloors[floorIndex].rooms.push({
        type: roomType,
        size: 'small'
      });
      setFloors(newFloors);
    } else {
      if (currentCount > 0) {
        newCounts[floorIndex][roomType] = currentCount - 1;
        
        // Remove the last room of this type
        const newFloors = [...floors];
        const roomIndex = newFloors[floorIndex].rooms.map((r, idx) => ({ ...r, idx }))
          .filter(r => r.type === roomType)
          .pop()?.idx;
        
        if (roomIndex !== undefined) {
          newFloors[floorIndex].rooms.splice(roomIndex, 1);
          setFloors(newFloors);
        }
      }
    }
    
    setRoomCounts(newCounts);
  };

  const toggleSingleRoom = (floorIndex: number, roomType: string) => {
    const newCounts = [...roomCounts];
    const currentCount = newCounts[floorIndex][roomType] || 0;
    
    if (currentCount === 0) {
      updateRoomCount(floorIndex, roomType, true);
    } else {
      updateRoomCount(floorIndex, roomType, false);
    }
  };

  const handleDrawingDiningSelection = (floorIndex: number, option: 'none' | 'drawing_only' | 'drawing_dining') => {
    const newCounts = [...roomCounts];
    const newFloors = [...floors];
    
    // First, remove existing drawing and dining rooms
    newFloors[floorIndex].rooms = newFloors[floorIndex].rooms.filter(r => r.type !== 'drawing' && r.type !== 'dining');
    newCounts[floorIndex]['drawing'] = 0;
    newCounts[floorIndex]['dining'] = 0;
    
    if (option === 'drawing_only') {
      newCounts[floorIndex]['drawing'] = 1;
      newFloors[floorIndex].rooms.push({ type: 'drawing', size: 'small' });
      setCombineDrawingDining(false);
    } else if (option === 'drawing_dining') {
      newCounts[floorIndex]['drawing'] = 1;
      newFloors[floorIndex].rooms.push({ type: 'drawing', size: 'small' });
      setCombineDrawingDining(true);
    }
    
    setFloors(newFloors);
    setRoomCounts(newCounts);
  };

  const updateRoomSize = (floorIndex: number, roomType: string, roomInstanceIndex: number, size: 'small' | 'medium' | 'large') => {
    const newFloors = [...floors];
    const roomsOfType = newFloors[floorIndex].rooms
      .map((r, idx) => ({ ...r, originalIdx: idx }))
      .filter(r => r.type === roomType);
    
    if (roomsOfType[roomInstanceIndex]) {
      const originalIdx = roomsOfType[roomInstanceIndex].originalIdx;
      newFloors[floorIndex].rooms[originalIdx].size = size;
      setFloors(newFloors);
    }
  };

  const toggleParapetWall = (floorIndex: number, roomInstanceIndex: number) => {
    const newFloors = [...floors];
    const roomsOfType = newFloors[floorIndex].rooms
      .map((r, idx) => ({ ...r, originalIdx: idx }))
      .filter(r => r.type === 'mumty');
    
    if (roomsOfType[roomInstanceIndex]) {
      const originalIdx = roomsOfType[roomInstanceIndex].originalIdx;
      const currentVal = newFloors[floorIndex].rooms[originalIdx].hasParapetWalls;
      newFloors[floorIndex].rooms[originalIdx].hasParapetWalls = !currentVal;
      setFloors(newFloors);
    }
  };

  const getRoomSize = (floorIndex: number, roomType: string, roomInstanceIndex: number): string => {
    const roomsOfType = floors[floorIndex]?.rooms.filter(r => r.type === roomType) || [];
    return roomsOfType[roomInstanceIndex]?.size || 'medium';
  };

  const hasParapetWall = (floorIndex: number, roomInstanceIndex: number): boolean => {
    const roomsOfType = floors[floorIndex]?.rooms.filter(r => r.type === 'mumty') || [];
    return roomsOfType[roomInstanceIndex]?.hasParapetWalls || false;
  };

  // Calculate total area used by all rooms across all floors
  const calculateTotalRoomArea = (): number => {
    let totalArea = 0;
    floors.forEach(floor => {
      floor.rooms.forEach(room => {
        totalArea += getRoomArea(room.size as 'small' | 'medium' | 'large', room.type, combineDrawingDining, plotMarlas);
      });
    });
    return totalArea;
  };

  // Calculate area used on current floor
  const calculateFloorRoomArea = (floorIndex: number): number => {
    let totalArea = 0;
    floors[floorIndex]?.rooms.forEach(room => {
      totalArea += getRoomArea(room.size as 'small' | 'medium' | 'large', room.type, combineDrawingDining, plotMarlas);
    });
    return totalArea;
  };

  const totalRoomArea = calculateTotalRoomArea();
  const currentFloorArea = calculateFloorRoomArea(currentFloor);
  const areaUtilizationPercent = (totalRoomArea / totalUsableArea) * 100;

  // Get color for floor-specific utilization
  const getFloorAreaStatusColor = (floorIndex: number) => {
    const floorArea = calculateFloorRoomArea(floorIndex);
    const percent = (floorArea / usableAreaPerFloor) * 100;
    
    if (percent > 100) return 'bg-red-100 border-red-400';
    if (percent > 90) return 'bg-amber-100 border-amber-400';
    if (percent > 70) return 'bg-blue-100 border-blue-400';
    return 'bg-green-100 border-green-400';
  };

  const getFloorAreaProgressColor = (floorIndex: number) => {
    const floorArea = calculateFloorRoomArea(floorIndex);
    const percent = (floorArea / usableAreaPerFloor) * 100;
    
    if (percent > 100) return 'bg-red-500';
    if (percent > 90) return 'bg-amber-500';
    if (percent > 70) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Check if at least one room is selected on each floor
    floors.forEach((floor, floorIndex) => {
      if (floor.rooms.length === 0) {
        newErrors[`floor${floorIndex}`] = `Floor ${floorIndex + 1} must have at least one room configured`;
      }
      
      if (floorIndex === 0) {
        const kitchenCount = floor.rooms.filter(r => r.type === 'kitchen').length;
        if (kitchenCount !== 1) {
          newErrors[`floor${floorIndex}_kitchen`] = `Ground Floor must have exactly 1 Kitchen`;
        }
        
        const loungeCount = floor.rooms.filter(r => r.type === 'lounge').length;
        if (loungeCount < 1) {
          newErrors[`floor${floorIndex}_lounge`] = `Ground Floor must have at least 1 Lounge`;
        }
      }
      
      const bedroomCount = floor.rooms.filter(r => r.type === 'bedroom').length;
      const bathroomCount = floor.rooms.filter(r => r.type === 'bathroom').length;
      if (bedroomCount > maxRoomsPerFloor) {
        newErrors[`floor${floorIndex}_bedrooms_max`] = `Floor ${floorIndex + 1} exceeds max allowed bedrooms limit of ${maxRoomsPerFloor} for ${plotMarlas} Marla.`;
      }
      if (bathroomCount > maxRoomsPerFloor) {
        newErrors[`floor${floorIndex}_bathrooms_max`] = `Floor ${floorIndex + 1} exceeds max allowed bathrooms limit of ${maxRoomsPerFloor} for ${plotMarlas} Marla.`;
      }
    });

    // Check if total room area exceeds usable area
    if (totalRoomArea > totalUsableArea) {
      const excess = totalRoomArea - totalUsableArea;
      newErrors['areaExceeded'] = `Total Covered Area (${Math.round(totalRoomArea)} sq ft) exceeds available usable space (${Math.round(totalUsableArea)} sq ft) by ${Math.round(excess)} sq ft. Please reduce room sizes or remove some rooms.`;
    }

    // Warning if close to limit (>90%)
    if (areaUtilizationPercent > 90 && areaUtilizationPercent <= 100) {
      newErrors['areaWarning'] = `You're using ${Math.round(areaUtilizationPercent)}% of available space. Consider if circulation space is adequate.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 || (Object.keys(newErrors).length === 1 && newErrors['areaWarning']);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      updateProjectData('roomDetails', { floors, combineDrawingDining });
      markStepComplete(2);
      onNext();
    }
  };

  const getFloorName = (floorNumber: number) => {
    if (floorNumber === 1) return 'Ground Floor';
    if (floorNumber === 2) return '1st Floor';
    if (floorNumber === 3) return '2nd Floor';
    if (floorNumber === 4) return '3rd Floor';
    return `${floorNumber}th Floor`;
  };

  const countSelectedRooms = (floorIndex: number) => {
    return floors[floorIndex]?.rooms.length || 0;
  };

  const totalRooms = floors.reduce((sum, floor) => sum + floor.rooms.length, 0);

  const getAreaStatusColor = () => {
    if (areaUtilizationPercent > 100) return 'text-red-600 bg-red-50 border-red-300';
    if (areaUtilizationPercent > 90) return 'text-amber-700 bg-amber-50 border-amber-300';
    if (areaUtilizationPercent > 70) return 'text-blue-700 bg-blue-50 border-blue-300';
    return 'text-green-700 bg-green-50 border-green-300';
  };

  const getAreaStatusIcon = () => {
    if (areaUtilizationPercent > 100) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (areaUtilizationPercent > 90) return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <Home className="w-5 h-5 text-blue-600" />;
  };

  const getSizeRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (areaUtilizationPercent > 100) {
      recommendations.push('Consider changing some Large rooms to Medium size');
      recommendations.push('Consider changing some Medium rooms to Small size');
      recommendations.push('Remove non-essential rooms (Store Room, Balcony)');
    } else if (areaUtilizationPercent > 90) {
      recommendations.push('You\'re near the space limit - leave some circulation space');
      recommendations.push('Consider if all rooms are necessary');
    }
    
    return recommendations;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">Room Details</h2>
        <p className="text-gray-600">
          Select number and sizes of rooms for each floor ({totalRooms} room{totalRooms !== 1 ? 's' : ''} configured)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Space Utilization Status */}
        <div className={`border-2 rounded-lg p-4 ${getAreaStatusColor()}`}>
          <div className="flex items-start gap-3">
            {getAreaStatusIcon()}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Overall Space Utilization</h4>
                <span className="text-lg font-bold">
                  {Math.round(areaUtilizationPercent)}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white rounded-full h-3 mb-2 overflow-hidden border">
                <div 
                  className={`h-full transition-all ${
                    areaUtilizationPercent > 100 ? 'bg-red-500' :
                    areaUtilizationPercent > 90 ? 'bg-amber-500' :
                    areaUtilizationPercent > 70 ? 'bg-blue-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(areaUtilizationPercent, 100)}%` }}
                />
              </div>
              
              <div className="text-sm space-y-1">
                <p>
                  <strong>Total Covered Area:</strong> {Math.round(totalRoomArea)} sq ft / {Math.round(totalUsableArea)} sq ft available
                </p>
                <p className="text-xs opacity-75">
                  Plot: {Math.round(plotArea)} sq ft × {numberOfFloors} floor{numberOfFloors > 1 ? 's' : ''} × 65% usable = {Math.round(totalUsableArea)} sq ft
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Floor Space Utilization */}
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Floor-wise Space Utilization</h4>
          <div className="grid md:grid-cols-2 gap-3">
            {floors.map((floor, index) => {
              const floorArea = calculateFloorRoomArea(index);
              const floorPercent = (floorArea / usableAreaPerFloor) * 100;
              
              return (
                <div 
                  key={index}
                  className={`border-2 rounded-lg p-3 ${getFloorAreaStatusColor(index)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{getFloorName(floor.floorNumber)}</span>
                    <span className="font-bold">{Math.round(floorPercent)}%</span>
                  </div>
                  
                  {/* Floor Progress Bar */}
                  <div className="w-full bg-white rounded-full h-2 mb-2 overflow-hidden border">
                    <div 
                      className={`h-full transition-all ${getFloorAreaProgressColor(index)}`}
                      style={{ width: `${Math.min(floorPercent, 100)}%` }}
                    />
                  </div>
                  
                  <div className="text-xs">
                    <p>{Math.round(floorArea)} / {Math.round(usableAreaPerFloor)} sq ft</p>
                    <p className="opacity-75">{countSelectedRooms(index)} room{countSelectedRooms(index) !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Area Exceeded Error */}
        {errors['areaExceeded'] && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-2">Area Limit Exceeded!</h4>
                <p className="text-red-800 text-sm mb-3">{errors['areaExceeded']}</p>
                
                {getSizeRecommendations().length > 0 && (
                  <div>
                    <p className="text-red-900 font-medium text-sm mb-1">Suggestions:</p>
                    <ul className="list-disc list-inside text-red-800 text-sm space-y-1">
                      {getSizeRecommendations().map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Area Warning */}
        {errors['areaWarning'] && !errors['areaExceeded'] && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-800 text-sm">{errors['areaWarning']}</p>
              </div>
            </div>
          </div>
        )}

        {/* Floor Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          {floors.map((floor, index) => {
            const floorArea = calculateFloorRoomArea(index);
            const floorPercent = (floorArea / usableAreaPerFloor) * 100;
            
            return (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentFloor(index)}
                className={`px-6 py-3 border-b-2 transition-colors ${
                  currentFloor === index
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div>
                  {getFloorName(floor.floorNumber)}
                  <span className="ml-2 text-sm">
                    ({countSelectedRooms(index)} room{countSelectedRooms(index) !== 1 ? 's' : ''})
                  </span>
                </div>
                <div className="text-xs mt-1">
                  {Math.round(floorArea)} sq ft ({Math.round(floorPercent)}%)
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Floor Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl">
              {getFloorName(floors[currentFloor]?.floorNumber || 1)}
            </h3>
            <div className="text-sm text-gray-600">
              Floor Area: <strong>{Math.round(currentFloorArea)} sq ft</strong> / {Math.round(usableAreaPerFloor)} sq ft
            </div>
          </div>

          {errors[`floor${currentFloor}`] && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors[`floor${currentFloor}`]}</p>
            </div>
          )}

          {errors[`floor${currentFloor}_kitchen`] && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors[`floor${currentFloor}_kitchen`]}</p>
            </div>
          )}
          {errors[`floor${currentFloor}_lounge`] && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors[`floor${currentFloor}_lounge`]}</p>
            </div>
          )}
          {errors[`floor${currentFloor}_bedrooms_max`] && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors[`floor${currentFloor}_bedrooms_max`]}</p>
            </div>
          )}
          {errors[`floor${currentFloor}_bathrooms_max`] && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors[`floor${currentFloor}_bathrooms_max`]}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* 1. Bedrooms */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">1. Bedrooms</h4>
              <div className="grid gap-4">
                {COUNTABLE_ROOMS.filter(r => r.id === 'bedroom').map((roomType) => {
                  const bedroomCount = roomCounts[currentFloor]?.[roomType.id] || 0;
                  const isMaxReached = bedroomCount >= maxRoomsPerFloor;

                  return (
                    <div key={roomType.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{roomType.icon}</span>
                        <label className="font-medium text-gray-900">
                          {roomType.label}
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateRoomCount(currentFloor, roomType.id, false)}
                          className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={!roomCounts[currentFloor] || roomCounts[currentFloor][roomType.id] === 0}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <div className="flex-1 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {roomCounts[currentFloor]?.[roomType.id] || 0}
                          </div>
                          <div className="text-xs text-gray-500">
                            {roomCounts[currentFloor]?.[roomType.id] === 1 ? 'room' : 'rooms'}
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => updateRoomCount(currentFloor, roomType.id, true)}
                          className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={isMaxReached}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Bathrooms & Washrooms */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">2. Bathrooms & Washrooms</h4>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex flex-col gap-5">
                  {COUNTABLE_ROOMS.filter(r => r.id === 'bathroom').map((roomType) => {
                    const bathroomCount = roomCounts[currentFloor]?.[roomType.id] || 0;
                    const isMaxReached = bathroomCount >= maxRoomsPerFloor;

                    return (
                      <div key={roomType.id}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{roomType.icon}</span>
                          <label className="font-medium text-gray-900">
                            {roomType.label}
                          </label>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateRoomCount(currentFloor, roomType.id, false)}
                            className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={!roomCounts[currentFloor] || roomCounts[currentFloor][roomType.id] === 0}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <div className="flex-1 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {roomCounts[currentFloor]?.[roomType.id] || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              {roomCounts[currentFloor]?.[roomType.id] === 1 ? 'room' : 'rooms'}
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => updateRoomCount(currentFloor, roomType.id, true)}
                            className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={isMaxReached}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Powder room removed */}
                </div>
              </div>
            </div>

            {/* 3. Living & Formal Spaces */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">3. Living & Formal Spaces</h4>
              <div className="grid gap-4">
                <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  roomCounts[currentFloor]?.['lounge'] > 0 ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={roomCounts[currentFloor]?.['lounge'] > 0}
                    onChange={() => toggleSingleRoom(currentFloor, 'lounge')}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📺</span>
                      <span className={`font-medium ${roomCounts[currentFloor]?.['lounge'] > 0 ? 'text-blue-900' : 'text-gray-900'}`}>
                        Lounge / Living Area {currentFloor === 0 && <span className="text-red-500">*</span>}
                      </span>
                    </div>
                    {currentFloor === 0 && roomCounts[currentFloor]?.['lounge'] === 0 && (
                      <span className="text-xs text-red-500 mt-1">Required on this floor</span>
                    )}
                  </div>
                </label>

                {currentFloor === 0 && (
                  <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    roomCounts[currentFloor]?.['drawing'] > 0 ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={roomCounts[currentFloor]?.['drawing'] > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleDrawingDiningSelection(currentFloor, 'drawing_only');
                        } else {
                          handleDrawingDiningSelection(currentFloor, 'none');
                        }
                      }}
                      className="mt-1 w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🛋️</span>
                        <span className={`font-medium ${roomCounts[currentFloor]?.['drawing'] > 0 ? 'text-blue-900' : 'text-gray-900'}`}>
                          Drawing Room (Formal Sitting)
                        </span>
                      </div>
                      
                      {roomCounts[currentFloor]?.['drawing'] > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={combineDrawingDining}
                              onChange={(e) => {
                                handleDrawingDiningSelection(currentFloor, e.target.checked ? 'drawing_dining' : 'drawing_only');
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-blue-800 font-medium">Combine with Dining Area (Large Space)</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* 4. Kitchen & Utility */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">4. Kitchen & Utility</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  roomCounts[currentFloor]?.['kitchen'] > 0 ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={roomCounts[currentFloor]?.['kitchen'] > 0}
                    onChange={() => toggleSingleRoom(currentFloor, 'kitchen')}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🍳</span>
                      <span className={`font-medium ${roomCounts[currentFloor]?.['kitchen'] > 0 ? 'text-blue-900' : 'text-gray-900'}`}>
                        Kitchen {currentFloor === 0 && <span className="text-red-500">*</span>}
                      </span>
                    </div>
                    {currentFloor === 0 && roomCounts[currentFloor]?.['kitchen'] === 0 && (
                      <span className="text-xs text-red-500 mt-1">Required on this floor</span>
                    )}
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  roomCounts[currentFloor]?.['store'] > 0 ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={roomCounts[currentFloor]?.['store'] > 0}
                    onChange={() => toggleSingleRoom(currentFloor, 'store')}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📦</span>
                      <span className={`font-medium ${roomCounts[currentFloor]?.['store'] > 0 ? 'text-blue-900' : 'text-gray-900'}`}>
                        Store Room
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* 5. Outdoors (Balcony / Terrace) */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">{currentFloor === 0 ? '5.' : '5.'} Outdoors</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {['balcony', 'terrace'].map((id) => {
                  if (currentFloor === 0 && id === 'balcony') return null; // No balconies on ground floor
                  const roomType = SINGLE_ROOMS.find(r => r.id === id);
                  if (!roomType) return null;
                    const isSelected = roomCounts[currentFloor]?.[id] > 0;
                    return (
                      <label key={id} className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSingleRoom(currentFloor, id)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{roomType.icon}</span>
                            <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {currentFloor === 0 && id === 'terrace' ? 'Porch' : roomType.label}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

            {/* 6. Roof Options (Top Floor Only) */}
            {currentFloor === floors.length - 1 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Roof Configuration</h4>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🏠</span>
                    <label className="font-medium text-gray-900">Rooftop with Mumty (Stair Enclosure)</label>
                  </div>

                  <label className={`flex items-start gap-3 cursor-pointer p-3 rounded border-2 transition-colors ${
                    roomCounts[currentFloor]?.['mumty'] > 0 ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}>
                    <input 
                      type="checkbox" 
                      checked={roomCounts[currentFloor]?.['mumty'] > 0}
                      onChange={() => toggleSingleRoom(currentFloor, 'mumty')}
                      className="mt-1 w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900 block">Add Mumty</span>
                      <span className="text-sm text-gray-600">Build a small stair enclosure (Mumty) to protect the stairs from weather.</span>
                      
                      {roomCounts[currentFloor]?.['mumty'] > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={hasParapetWall(currentFloor, 0)}
                              onChange={() => toggleParapetWall(currentFloor, 0)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-800 font-medium">Add Parapet Walls (Standard 3.5 ft high roof boundary wall)</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Room Size Configuration */}
          {totalRooms > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">{currentFloor === 0 ? '4.' : '3.'} Configure Selected Room Sizes</h4>
              <div className="space-y-4">
                {ALL_ROOM_TYPES.map((roomType) => {
                  const count = roomCounts[currentFloor]?.[roomType.id] || 0;
                  if (count === 0 || roomType.id === 'mumty') return null;

                  const displayLabel = currentFloor === 0 && roomType.id === 'terrace' ? 'Porch' : roomType.label;
                  return (
                    <div key={roomType.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{roomType.icon}</span>
                        <h5 className="font-semibold text-blue-900">
                          {displayLabel} ({count})
                        </h5>
                      </div>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.from({ length: count }).map((_, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              {displayLabel.replace(/s$/, '')} {idx + 1}
                            </div>
                            
                            {/* Render size buttons normally for all rooms including combined drawing/dining */}
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => updateRoomSize(currentFloor, roomType.id, idx, 'small')}
                                className={`px-2 py-2 text-xs rounded border-2 transition-colors ${
                                  getRoomSize(currentFloor, roomType.id, idx) === 'small'
                                    ? 'border-blue-500 bg-blue-500 text-white font-semibold'
                                    : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400'
                                }`}
                              >
                                Small
                              </button>
                              <button
                                type="button"
                                onClick={() => updateRoomSize(currentFloor, roomType.id, idx, 'medium')}
                                className={`px-2 py-2 text-xs rounded border-2 transition-colors ${
                                  getRoomSize(currentFloor, roomType.id, idx) === 'medium'
                                    ? 'border-blue-500 bg-blue-500 text-white font-semibold'
                                    : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400'
                                }`}
                              >
                                Medium
                              </button>
                              <button
                                type="button"
                                onClick={() => updateRoomSize(currentFloor, roomType.id, idx, 'large')}
                                className={`px-2 py-2 text-xs rounded border-2 transition-colors ${
                                  getRoomSize(currentFloor, roomType.id, idx) === 'large'
                                    ? 'border-blue-500 bg-blue-500 text-white font-semibold'
                                    : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400'
                                }`}
                              >
                                Large
                              </button>
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-2">
                              {getSizeDescription(getRoomSize(currentFloor, roomType.id, idx), roomType.id, combineDrawingDining, plotMarlas)}
                            </p>
                            
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Project Summary</h4>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-700">Total Floors:</p>
              <p className="font-semibold text-blue-900">{numberOfFloors}</p>
            </div>
            <div>
              <p className="text-blue-700">Total Rooms:</p>
              <p className="font-semibold text-blue-900">{totalRooms}</p>
            </div>
            <div>
              <p className="text-blue-700">Plot Area:</p>
              <p className="font-semibold text-blue-900">
                {projectData.plotDetails.plotArea} sq ft
              </p>
            </div>
            <div>
              <p className="text-blue-700">Space Used:</p>
              <p className="font-semibold text-blue-900">
                {Math.round(areaUtilizationPercent)}%
              </p>
            </div>
          </div>
        </div>

        {/* Size Guide */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2">Room Size Guide</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-amber-900">
            <div>
              <p className="font-semibold">Small (~100-120 sq ft):</p>
              <p>10×10 to 10×12 ft</p>
            </div>
            <div>
              <p className="font-semibold">Medium (~168-224 sq ft):</p>
              <p>12×14 to 14×16 ft</p>
            </div>
            <div>
              <p className="font-semibold">Large (~288+ sq ft):</p>
              <p>16×18 ft and above</p>
            </div>
          </div>
          <p className="text-xs text-amber-800 mt-3">
            💡 Tip: You can select any size, but make sure total room area doesn't exceed available space. 
            The system accounts for 35% space for walls, stairs, and circulation.
          </p>
        </div>

        <button
          type="submit"
          disabled={areaUtilizationPercent > 100}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {areaUtilizationPercent > 100 ? 'Please Reduce Room Sizes to Continue' : 'Save & Continue to Gray Structure'}
        </button>
      </form>
    </div>
  );
}