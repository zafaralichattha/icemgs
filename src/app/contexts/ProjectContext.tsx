import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { projectService, Project } from '../services/api.service';

export interface RoomDetail {
  type: string; // 'bedroom', 'bathroom', 'kitchen', 'drawing', 'dining', 'store', 'lounge', 'terrace', 'powder_room', 'mumty', 'spiral_stairs'
  size: 'none' | 'small' | 'medium' | 'large';
  hasParapetWalls?: boolean;
}

export interface FloorDetail {
  floorNumber: number;
  rooms: RoomDetail[];
}

export interface ProjectData {
  id?: string;
  currentStep: number;
  completedSteps: number[];
  plotDetails: {
    plotMarlas: string;
    marlaSize: string; // 225, 250, 272, 275
    plotArea: string; // Auto-calculated
    numberOfFloors: string;
    location: string;
  };
  roomDetails: {
    floors: FloorDetail[];
    combineDrawingDining: boolean;
  };
  constructionType: 'gray-only' | 'complete'; // New field
  grayStructure: {
    foundationType: string;
    wallMaterial: string;
    wallThickness: string; // New field
    roofType: string;
    steelGrade: string;
    cementType: string;
    brickType: string; // New field
    plasterType: string; // New field
    spiralStairs: boolean;
  };
  finishing: {
    flooringType: string;
    paintQuality: string;
    tilesQuality: string;
    doorType: string;
    windowType: string;
    electricalFittings: string;
    plumbingQuality: string;
    sanitaryQuality: string; // New field
    kitchenCabinets: string; // New field
  };
  compliance: {
    frontSetback: string;
    rearSetback: string;
    sideSetbacks: string;
    maxHeight: string;
    coverageRatio: string;
  };
}

interface ProjectContextType {
  projectData: ProjectData;
  loading: boolean;
  error: string | null;
  updateProjectData: (step: keyof ProjectData, data: any) => void;
  markStepComplete: (step: number) => void;
  resetProject: () => void;
  saveProject: () => Promise<string>;
  loadProject: (id: string) => Promise<void>;
  getAllProjects: () => Promise<Project[]>;
}

const initialProjectData: ProjectData = {
  currentStep: 1,
  completedSteps: [],
  plotDetails: {
    plotMarlas: '',
    marlaSize: '',
    plotArea: '',
    numberOfFloors: '',
    location: ''
  },
  roomDetails: {
    floors: [],
    combineDrawingDining: false
  },
  constructionType: 'complete',
  grayStructure: {
    foundationType: '',
    wallMaterial: '',
    wallThickness: '9-inch-outer-4.5-inch-inner',
    roofType: '',
    steelGrade: '',
    cementType: '',
    brickType: '',
    plasterType: '',
    spiralStairs: false
  },
  finishing: {
    flooringType: '',
    paintQuality: '',
    tilesQuality: '',
    doorType: '',
    windowType: '',
    electricalFittings: '',
    plumbingQuality: '',
    sanitaryQuality: '',
    kitchenCabinets: ''
  },
  compliance: {
    frontSetback: '',
    rearSetback: '',
    sideSetbacks: '',
    maxHeight: '',
    coverageRatio: ''
  }
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use a ref for the project ID to avoid stale closures causing duplicate creates
  const projectIdRef = useRef<string | undefined>(undefined);
  // Guard against concurrent saves
  const savingRef = useRef(false);

  const updateProjectData = (step: keyof ProjectData, data: any) => {
    setProjectData(prev => {
      // If data is a primitive (string, number, boolean), set it directly
      if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
        return {
          ...prev,
          [step]: data
        };
      }
      // Otherwise, merge objects as before
      return {
        ...prev,
        [step]: { ...(prev[step as keyof ProjectData] as object), ...data }
      };
    });
  };

  const markStepComplete = (step: number) => {
    setProjectData(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step],
      currentStep: step + 1
    }));
  };

  const resetProject = () => {
    setProjectData(initialProjectData);
    projectIdRef.current = undefined;
    setError(null);
  };

  const saveProject = async (): Promise<string> => {
    // Guard against concurrent saves (e.g., double-clicking "Save & Exit")
    if (savingRef.current) {
      console.warn('⚠️ Save already in progress, skipping duplicate save call.');
      // Return the existing project ID if available
      if (projectIdRef.current) return projectIdRef.current;
      throw new Error('Save already in progress');
    }

    savingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const apiData = {
        name: `Project ${projectData.plotDetails.location || 'Untitled'}`,
        construction_type: projectData.constructionType === 'complete' ? 'full' as const : 'gray' as const,
        plot_area: parseFloat(projectData.plotDetails.plotArea) || 0,
        plot_unit: 'marla',
        location: projectData.plotDetails.location || '',
        plot_marlas: projectData.plotDetails.plotMarlas ? parseFloat(projectData.plotDetails.plotMarlas) : null,
        marla_size: projectData.plotDetails.marlaSize ? parseInt(projectData.plotDetails.marlaSize) : null,
        num_floors: parseInt(projectData.plotDetails.numberOfFloors) || 1,
        
        // Gray Structure
        gray_structure_details: {
          foundation_type: projectData.grayStructure.foundationType,
          wall_material: projectData.grayStructure.wallMaterial,
          wall_thickness: projectData.grayStructure.wallThickness,
          roof_type: projectData.grayStructure.roofType,
          steel_grade: projectData.grayStructure.steelGrade,
          cement_type: projectData.grayStructure.cementType,
          brick_type: projectData.grayStructure.brickType,
          plaster_type: projectData.grayStructure.plasterType,
          spiral_stairs: projectData.grayStructure.spiralStairs || false,
        },
        
        // Finishing Details
        finishing_details: {
          floor_tiles: projectData.finishing.flooringType,
          paint: projectData.finishing.paintQuality,
          wall_tiles: projectData.finishing.tilesQuality,
          doors: projectData.finishing.doorType,
          windows: projectData.finishing.windowType,
          electrical: projectData.finishing.electricalFittings,
          plumbing: projectData.finishing.plumbingQuality,
          sanitary: projectData.finishing.sanitaryQuality,
          cabinets: projectData.finishing.kitchenCabinets,
        },
        
        // Compliance
        lda_compliant: true,
        front_setback: projectData.compliance.frontSetback,
        rear_setback: projectData.compliance.rearSetback,
        side_setbacks: projectData.compliance.sideSetbacks,
        max_height: projectData.compliance.maxHeight,
        coverage_ratio: projectData.compliance.coverageRatio,
        
        // Floors and Rooms
        floors: projectData.roomDetails.floors.map((f: any) => ({
            floor_number: f.floorNumber - 1,
            floor_type: f.floorNumber === 1 ? 'ground' : f.floorNumber === 2 ? 'first' : f.floorNumber === 3 ? 'second' : f.floorNumber === 4 ? 'third' : 'ground',
            total_area: 0,
            rooms: f.rooms.map((r: any) => {
                let mappedType = r.type;
                if (r.type === 'drawing') mappedType = 'drawing_room';
                else if (r.type === 'dining') mappedType = 'dining_room';
                else if (r.type === 'store') mappedType = 'store_room';
                else if (r.type === 'lounge') mappedType = 'living_room';
                
                return {
                    room_type: mappedType,
                    size: r.size,
                    custom_name: r.type,
                    has_parapet_walls: r.hasParapetWalls || false
                };
            })
        }))
      };

      let savedProject: Project;

      // Use the ref (not state) to determine create vs update — refs are synchronous
      const existingId = projectIdRef.current || projectData.id;

      if (existingId) {
        // Update existing project
        console.log('📝 Updating existing project:', existingId);
        savedProject = await projectService.update(existingId, apiData as any);
      } else {
        // Create new project
        console.log('🆕 Creating new project...');
        savedProject = await projectService.create(apiData as any);
        console.log('✅ Project created with ID:', savedProject.id);
      }

      // Set the ref IMMEDIATELY (synchronous) so any subsequent save calls
      // will see the ID and update instead of creating again
      projectIdRef.current = savedProject.id;

      // Then update React state
      setProjectData(prev => ({
        ...prev,
        id: savedProject.id
      }));

      return savedProject.id;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || err.message || 'Failed to save project to database';
      setError(errorMessage);
      console.error('Error saving project:', err);
      throw err; // Stop execution and notify caller
    } finally {
      setLoading(false);
      savingRef.current = false;
    }
  };

  const loadProject = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from API first
      const apiProject = await projectService.getById(id);

      // Dynamically determine current and completed steps based on populated data
      const completedSteps: number[] = [];
      let currentStep = 1;

      if (apiProject.plot_area && parseFloat(apiProject.plot_area.toString()) > 0) {
        completedSteps.push(1);
        currentStep = 2;
      }
      if ((apiProject as any).floors && (apiProject as any).floors.length > 0) {
        completedSteps.push(2);
        currentStep = 3;
      }
      if ((apiProject as any).gray_structure_details && (apiProject as any).gray_structure_details.foundation_type) {
        completedSteps.push(3);
        currentStep = apiProject.construction_type === 'full' ? 4 : 5;
      }
      if (apiProject.construction_type === 'full' && (apiProject as any).finishing_details && (apiProject as any).finishing_details.floor_tiles) {
        completedSteps.push(4);
        currentStep = 5;
      }
      if ((apiProject as any).front_setback || (apiProject as any).lda_compliant) {
        completedSteps.push(5);
        currentStep = 6;
      }

      // Map API response to frontend format
      const mappedProject: ProjectData = {
        id: apiProject.id,
        currentStep: currentStep,
        completedSteps: completedSteps,
        plotDetails: {
          plotMarlas: (apiProject as any).plot_marlas || '',
          marlaSize: (apiProject as any).marla_size || '',
          plotArea: apiProject.plot_area?.toString() || '',
          numberOfFloors: apiProject.num_floors?.toString() || '1',
          location: apiProject.location || ''
        },
        roomDetails: {
          floors: ((apiProject as any).floors || []).map((f: any) => ({
            floorNumber: f.floor_number + 1,
            rooms: (f.rooms || []).map((r: any) => {
              let mappedType = r.room_type;
              if (r.room_type === 'drawing_room') mappedType = 'drawing';
              else if (r.room_type === 'dining_room') mappedType = 'dining';
              else if (r.room_type === 'store_room') mappedType = 'store';
              else if (r.room_type === 'living_room') mappedType = 'lounge';

              return {
                type: mappedType,
                size: r.size || 'none',
                hasParapetWalls: r.has_parapet_walls || false
              };
            })
          })),
          combineDrawingDining: false
        },
        constructionType: apiProject.construction_type === 'full' ? 'complete' : 'gray-only',
        grayStructure: {
          foundationType: (apiProject as any).gray_structure_details?.foundation_type || '',
          wallMaterial: (apiProject as any).gray_structure_details?.wall_material || '',
          wallThickness: (apiProject as any).gray_structure_details?.wall_thickness || '',
          roofType: (apiProject as any).gray_structure_details?.roof_type || '',
          steelGrade: (apiProject as any).gray_structure_details?.steel_grade || '',
          cementType: (apiProject as any).gray_structure_details?.cement_type || '',
          brickType: (apiProject as any).gray_structure_details?.brick_type || '',
          plasterType: (apiProject as any).gray_structure_details?.plaster_type || '',
          spiralStairs: (apiProject as any).gray_structure_details?.spiral_stairs || false
        },
        finishing: {
          flooringType: (apiProject as any).finishing_details?.floor_tiles || '',
          paintQuality: (apiProject as any).finishing_details?.paint || '',
          tilesQuality: (apiProject as any).finishing_details?.wall_tiles || '',
          doorType: (apiProject as any).finishing_details?.doors || '',
          windowType: (apiProject as any).finishing_details?.windows || '',
          electricalFittings: (apiProject as any).finishing_details?.electrical || '',
          plumbingQuality: (apiProject as any).finishing_details?.plumbing || '',
          sanitaryQuality: (apiProject as any).finishing_details?.sanitary || '',
          kitchenCabinets: (apiProject as any).finishing_details?.cabinets || ''
        },
        compliance: {
          frontSetback: (apiProject as any).front_setback || '',
          rearSetback: (apiProject as any).rear_setback || '',
          sideSetbacks: (apiProject as any).side_setbacks || '',
          maxHeight: (apiProject as any).max_height || '',
          coverageRatio: (apiProject as any).coverage_ratio || ''
        }
      };

      // Set the ref so subsequent saves update this project, not create a new one
      projectIdRef.current = apiProject.id;
      setProjectData(mappedProject);
    } catch (err: any) {
      console.error('Error loading from API:', err);
      setError('Project not found or failed to load');
    } finally {
      setLoading(false);
    }
  };

  const getAllProjects = async (): Promise<Project[]> => {
    setLoading(true);
    setError(null);

    try {
      const projects = await projectService.getAll();
      return projects;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load projects';
      setError(errorMessage);
      console.error('Error loading projects:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectContext.Provider value={{
      projectData,
      loading,
      error,
      updateProjectData,
      markStepComplete,
      resetProject,
      saveProject,
      loadProject,
      getAllProjects
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}