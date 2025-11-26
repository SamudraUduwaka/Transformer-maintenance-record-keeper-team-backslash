import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface WorkContentItem {
  itemNo: number;
  doCheck: boolean;
  doClean: boolean;
  doTighten: boolean;
  doReplace: boolean;
  other: string;
  afterInspectionStatus: "OK" | "NOT_OK" | "";
  afterInspectionNos: string;
}

export interface MaterialItem {
  description: string;
  code: string;
  used: boolean;
}

export interface ThermalInspectionData {
  // Basic Details
  branch: string;
  transformerNo: string;
  poleNumber: string;
  locationDetails: string;

  // Inspection Metadata
  inspectionDate: string | null;
  inspectionTime: string | null;
  inspectedBy: string;

  // Baseline Imaging
  baselineImagingRightNo: string;
  baselineImagingLeftNo: string;

  // Load / kVA Details
  lastMonthKva: string;
  lastMonthDate: string | null;
  lastMonthTime: string | null;
  currentMonthKva: string;

  // Operating / Environment
  baselineCondition: string;
  transformerType: string;

  // Meter Details
  meterSerial: string;
  meterCtRatio: string;
  meterMake: string;

  // After Thermal
  afterThermalDate: string | null;
  afterThermalTime: string | null;

  // Work Content
  workContent: WorkContentItem[];

  // First Inspection Readings
  firstInspectionVoltageR: string;
  firstInspectionVoltageY: string;
  firstInspectionVoltageB: string;
  firstInspectionCurrentR: string;
  firstInspectionCurrentY: string;
  firstInspectionCurrentB: string;

  // Second Inspection Readings
  secondInspectionVoltageR: string;
  secondInspectionVoltageY: string;
  secondInspectionVoltageB: string;
  secondInspectionCurrentR: string;
  secondInspectionCurrentY: string;
  secondInspectionCurrentB: string;
}

export interface MaintenanceRecordData {
  // Time Details
  startTime: string | null;
  completionTime: string | null;

  // Personnel
  supervisedBy: string;
  tech1: string;
  tech2: string;
  tech3: string;
  helpers: string;

  // Inspection Details
  maintenanceInspectedBy: string;
  maintenanceInspectedDate: string | null;
  maintenanceRectifiedBy: string;
  maintenanceRectifiedDate: string | null;
  maintenanceReinspectedBy: string;
  maintenanceReinspectedDate: string | null;

  // CSS Details
  cssOfficer: string;
  cssDate: string | null;

  // Correction Details
  allSpotsCorrectedBy: string;
  allSpotsCorrectedDate: string | null;
}

export interface WorkDataSheetData {
  // Gang Leader & Job Details
  gangLeader: string;
  jobDate: string | null;
  jobStartTime: string | null;

  // Transformer Details
  serialNo: string;
  kvaRating: string;
  tapPosition: string;
  ctRatio: string;
  earthResistance: string;
  neutral: string;

  // Checks
  surgeChecked: boolean;
  bodyChecked: boolean;

  // FDS Fuse Details
  fdsFuseF1: string;
  fdsFuseF2: string;
  fdsFuseF3: string;
  fdsFuseF4: string;
  fdsFuseF5: string;

  // Job Completion
  jobCompletedTime: string | null;

  // Notes
  notes: string;

  // Materials
  materials: MaterialItem[];
}

export interface MaintenanceFormData {
  inspectionId: number;
  transformerNo: string;
  thermalInspection: ThermalInspectionData;
  maintenanceRecord: MaintenanceRecordData;
  workDataSheet: WorkDataSheetData;
}

const getAuthHeaders = () => {
  const token = tokenStorage.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export const inspectionService = {
  /**
   * Get maintenance form data for a specific inspection
   */
  getMaintenanceFormData: async (inspectionId: number): Promise<MaintenanceFormData | null> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/inspections/${inspectionId}/maintenance-form`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 404) {
        return null; // No maintenance data exists yet
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch maintenance form data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching maintenance form data:', error);
      throw error;
    }
  },

  /**
   * Save or update maintenance form data
   */
  saveMaintenanceFormData: async (data: MaintenanceFormData): Promise<MaintenanceFormData> => {
    try {
      const url = data.inspectionId 
        ? `${API_BASE_URL}/inspections/${data.inspectionId}/maintenance-form`
        : `${API_BASE_URL}/inspections/maintenance-form`;

      const response = await fetch(url, {
        method: data.inspectionId ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save maintenance form: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving maintenance form data:', error);
      throw error;
    }
  },

  /**
   * Submit final maintenance form (mark as complete)
   */
  submitMaintenanceForm: async (inspectionId: number, data: MaintenanceFormData): Promise<MaintenanceFormData> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/inspections/${inspectionId}/maintenance-form/submit`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to submit maintenance form: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting maintenance form:', error);
      throw error;
    }
  },

  /**
   * Get inspection details by ID
   */
  getInspectionById: async (inspectionId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inspections/${inspectionId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch inspection: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching inspection:', error);
      throw error;
    }
  },

  /**
   * Get transformer details by number
   */
  getTransformerByNo: async (transformerNo: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transformers/${encodeURIComponent(transformerNo)}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transformer: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching transformer:', error);
      throw error;
    }
  },
};
