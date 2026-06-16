import api from '../config/api';

// ==================== TYPES ====================

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'homeowner' | 'contractor' | 'student' | 'admin';
  phone_number?: string;
  company_name?: string;
  profile_picture?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  category_display: string;
  quality: 'standard' | 'good' | 'premium';
  quality_display: string;
  unit: string;
  rate: string;
  description?: string;
  is_active: boolean;
  is_price_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  user: number;
  owner_email?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  status_display?: string;
  construction_type: 'gray' | 'full';
  construction_type_display?: string;
  plot_area: string;
  plot_unit: string;
  plot_length?: string;
  plot_width?: string;
  plot_marlas?: string;
  marla_size?: string;
  location?: string;
  num_floors: number;
  total_built_area: string;
  gray_structure_cost: string;
  finishing_cost: string;
  labor_cost: string;
  total_cost: string;
  lda_compliant: boolean;
  compliance_notes?: string;
  floor_plan_data?: any;
  floors?: Floor[];
  finishing_details?: FinishingDetails;
  bill_of_materials?: BillOfMaterial[];
  created_at: string;
  updated_at: string;
}

export interface Floor {
  id: string;
  project: string;
  floor_number: number;
  floor_type: 'ground' | 'first' | 'second' | 'third' | 'basement';
  floor_type_display?: string;
  total_area: string;
  rooms?: Room[];
}

export interface Room {
  id: string;
  floor: string;
  room_type: string;
  room_type_display?: string;
  custom_name?: string;
  length: string;
  width: string;
  height: string;
  area: string;
  has_attached_bathroom: boolean;
  has_balcony: boolean;
}

export interface FinishingDetails {
  id: string;
  project: string;
  floor_tiles?: string;
  floor_tiles_detail?: Material;
  wall_tiles?: string;
  wall_tiles_detail?: Material;
  paint?: string;
  paint_detail?: Material;
  doors?: string;
  doors_detail?: Material;
  door_quantity: number;
  windows?: string;
  windows_detail?: Material;
  window_quantity: number;
  electrical?: string;
  electrical_detail?: Material;
  plumbing?: string;
  plumbing_detail?: Material;
  sanitary?: string;
  sanitary_detail?: Material;
  cabinets?: string;
  cabinets_detail?: Material;
  created_at: string;
  updated_at: string;
}

export interface BillOfMaterial {
  id: string;
  project: string;
  material: string;
  material_detail?: Material;
  category: 'gray_structure' | 'finishing';
  category_display?: string;
  quantity: string;
  unit: string;
  rate: string;
  total_cost: string;
}

// ==================== AUTH SERVICE ====================

export const authService = {
  async register(data: {
    email: string;
    password1: string;
    password2: string;
    first_name: string;
    last_name: string;
    role: 'homeowner' | 'contractor' | 'student';
    phone_number?: string;
    company_name?: string;
  }): Promise<{ success: boolean; message: string; requiresVerification: boolean; token?: string; user?: User }> {
    try {
      // Log the data being sent for debugging
      console.log('📤 Sending registration data:', data);

      const response = await api.post('auth/registration/', data);

      console.log('✅ Registration response:', response.data);

      // Auto-verify bypass is active. We read the token and user from the response.
      const user = response.data?.user;
      const token = response.data?.key;
      
      return { 
        success: true, 
        message: 'Registration successful', 
        requiresVerification: false,
        token: token,
        user: user
      };
    } catch (error: any) {
      // Log detailed error information
      console.error('❌ Registration error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      // Extract error message from response
      const responseError = (error as any).response;
      if (responseError?.data) {
        const errorData = responseError.data;

        // Handle different error formats
        if (typeof errorData === 'object') {
          const errorMessages: string[] = [];

          // Iterate through error fields
          for (const messages of Object.values(errorData)) {
            if (Array.isArray(messages)) {
              errorMessages.push(...messages);
            } else if (typeof messages === 'string') {
              errorMessages.push(messages);
            }
          }

          if (errorMessages.length > 0) {
            const customError = new Error(errorMessages[0]) as any;
            customError.response = customError.response || {};
            customError.response.data = errorData;
            throw customError;
          }
        }
      }

      throw error;
    }
  },

  async login(email: string, password: string) {
    const response = await api.post('auth/login/', { email, password });
    const key = response.data?.key || response.data?.token;
    if (!key) {
      throw new Error('Login response did not return an auth token.');
    }
    localStorage.setItem('auth_token', key);
    const user = await this.getCurrentUser();
    localStorage.setItem('user', JSON.stringify(user));
    return { token: key, user };
  },

  async googleLogin(accessToken: string) {
    const response = await api.post('/auth/google/login/', {
      access_token: accessToken,
    });

    const key = response.data?.key;
    if (key) {
      localStorage.setItem('auth_token', key);
      try {
        const user = await this.getCurrentUser();
        localStorage.setItem('user', JSON.stringify(user));
        return { key, user };
      } catch (e) {
        console.error('Failed to fetch user after Google login', e);
        throw e; // Bubble up the error so the UI shows why authentication failed
      }
    }
    return response.data;
  },

  async verifyEmail(email: string, otp: string) {
    const response = await api.post('auth/verify-email/', { email, otp });
    const key = response.data?.key;
    if (!key) {
      throw new Error('Verification failed. Invalid response.');
    }
    localStorage.setItem('auth_token', key);
    const user = await this.getCurrentUser();
    localStorage.setItem('user', JSON.stringify(user));
    return { token: key, user };
  },

  async resendOtp(email: string) {
    const response = await api.post('auth/resend-otp/', { email });
    return response.data;
  },

  async logout() {
    try {
      await api.post('auth/logout/');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('users/me/');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  async updateProfile(data: Partial<User> | FormData): Promise<User> {
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

    const response = await api.put('users/update_profile/', data, config);
    const currentUser = this.getStoredUser();
    const updatedUser = { ...currentUser, ...response.data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  },

  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    const response = await api.post('auth/password/change/', {
      old_password: oldPassword,
      new_password1: newPassword,
      new_password2: newPassword,
    });
    // dj_rest_auth may return a new token after password change
    const newToken = response.data?.key || response.data?.token;
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    }
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  },
};

// ==================== USER SERVICE ====================

export const userService = {
  async getAll(): Promise<User[]> {
    const response = await api.get('users/');
    return response.data.results ? response.data.results : response.data;
  },

  async create(data: Partial<User>): Promise<User> {
    const response = await api.post('users/', data);
    return response.data;
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const response = await api.patch(`users/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`users/${id}/`);
  }
};

// ==================== MATERIAL SERVICE ====================

export const materialService = {
  async getAll(): Promise<Material[]> {
    const response = await api.get('materials/');
    // Handle Django REST Framework pagination wrapper
    return response.data.results ? response.data.results : response.data;
  },

  async getById(id: string): Promise<Material> {
    const response = await api.get(`materials/${id}/`);
    return response.data;
  },

  async getByCategory(category: string): Promise<Material[]> {
    const response = await api.get(`materials/by_category/?category=${category}`);
    return response.data;
  },

  async create(data: Partial<Material>): Promise<Material> {
    const response = await api.post('materials/', data);
    return response.data;
  },

  async update(id: string, data: Partial<Material>): Promise<Material> {
    const response = await api.patch(`materials/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`materials/${id}/`);
  },

  async bulkUpdateRates(updates: { id: string; rate: number }[]): Promise<{ message: string; updated_count: number }> {
    const response = await api.post('materials/bulk_update_rates/', { updates });
    return response.data;
  },

  async syncMarketPrices(): Promise<{ status: string; updated_count: number; locked_count?: number; failed_items: string[] }> {
    const response = await api.post('materials/sync_market_prices/');
    return response.data;
  },

  async togglePriceLock(id: string, locked: boolean): Promise<Material> {
    const response = await api.patch(`materials/${id}/`, { is_price_locked: locked });
    return response.data;
  },
};

// ==================== PROJECT SERVICE ====================

export const projectService = {
  async getAll(): Promise<Project[]> {
    const response = await api.get('projects/');
    return response.data.results ? response.data.results : response.data;
  },

  async getById(id: string): Promise<Project> {
    const response = await api.get(`projects/${id}/`);
    return response.data;
  },

  async create(data: {
    name: string;
    construction_type: 'gray' | 'full';
    plot_area: number;
    plot_unit: string;
    plot_length?: number;
    plot_width?: number;
    location?: string;
    num_floors: number;
  }): Promise<Project> {
    const response = await api.post('projects/', data);
    return response.data;
  },

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const response = await api.patch(`projects/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`projects/${id}/`);
  },

  async calculateCosts(id: string): Promise<{
    gray_structure_cost: string;
    finishing_cost: string;
    labor_cost: string;
    total_cost: string;
    materials_breakdown: any[];
  }> {
    const response = await api.post(`projects/${id}/calculate_costs/`);
    return response.data;
  },

  async generateFloorPlan(id: string): Promise<{
    svg_data: string;
    rooms_layout: any[];
    lda_compliance_check: any;
  }> {
    const response = await api.post(`projects/${id}/generate_floor_plan/`);
    return response.data;
  },

  async downloadPDF(id: string): Promise<Blob> {
    const response = await api.get(`projects/${id}/download_pdf/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// ==================== FLOOR SERVICE ====================

export const floorService = {
  async getAll(): Promise<Floor[]> {
    const response = await api.get('floors/');
    return response.data.results ? response.data.results : response.data;
  },

  async getById(id: string): Promise<Floor> {
    const response = await api.get(`floors/${id}/`);
    return response.data;
  },

  async create(data: {
    project: string;
    floor_number: number;
    floor_type: 'ground' | 'first' | 'second' | 'third' | 'basement';
    total_area?: number;
  }): Promise<Floor> {
    const response = await api.post('floors/', data);
    return response.data;
  },

  async update(id: string, data: Partial<Floor>): Promise<Floor> {
    const response = await api.patch(`floors/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`floors/${id}/`);
  },
};

// ==================== ROOM SERVICE ====================

export const roomService = {
  async getAll(): Promise<Room[]> {
    const response = await api.get('rooms/');
    return response.data.results ? response.data.results : response.data;
  },

  async getById(id: string): Promise<Room> {
    const response = await api.get(`rooms/${id}/`);
    return response.data;
  },

  async create(data: {
    floor: string;
    room_type: string;
    custom_name?: string;
    length: number;
    width: number;
    height: number;
    has_attached_bathroom?: boolean;
    has_balcony?: boolean;
  }): Promise<Room> {
    const response = await api.post('rooms/', data);
    return response.data;
  },

  async update(id: string, data: Partial<Room>): Promise<Room> {
    const response = await api.patch(`rooms/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`rooms/${id}/`);
  },
};

// ==================== FINISHING SERVICE ====================

export const finishingService = {
  async getAll(): Promise<FinishingDetails[]> {
    const response = await api.get('finishing/');
    return response.data;
  },

  async getById(id: string): Promise<FinishingDetails> {
    const response = await api.get(`finishing/${id}/`);
    return response.data;
  },

  async create(data: Partial<FinishingDetails>): Promise<FinishingDetails> {
    const response = await api.post('finishing/', data);
    return response.data;
  },

  async update(id: string, data: Partial<FinishingDetails>): Promise<FinishingDetails> {
    const response = await api.patch(`finishing/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`finishing/${id}/`);
  },
};

// ==================== BOM SERVICE ====================

export const bomService = {
  async getByProject(projectId: string): Promise<BillOfMaterial[]> {
    const response = await api.get(`bill-of-materials/?project=${projectId}`);
    return response.data.results ? response.data.results : response.data;
  },
};

// ==================== DASHBOARD SERVICE ====================

export const dashboardService = {
  async getStats(): Promise<{
    total_projects: number;
    active_projects: number;
    completed_projects?: number;
    total_investment?: number;
    total_users?: number;
    total_materials?: number;
    recent_projects: Project[];
  }> {
    const response = await api.get('dashboard/stats/');
    return response.data;
  },
};

// ==================== AI PREDICTION SERVICE ====================

export interface AIPredictionParams {
  plot_area: number;
  num_floors: number;
  construction_type: 'gray' | 'full';
  quality: 'economy' | 'standard' | 'premium' | 'luxury';
  location: string;
  marla_size: number;
  prediction_months: number;
}

export interface AIPredictionResult {
  current_estimate: {
    total_cost: number;
    gray_structure_cost: number;
    finishing_cost: number;
    labor_cost: number;
    per_sqft_rate: number;
  };
  monthly_predictions: Array<{
    month: number;
    label: string;
    predicted_cost: number;
    inflation_rate: number;
    confidence: number;
    key_factor: string;
  }>;
  risk_factors: Array<{
    factor: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
    potential_increase_pct: number;
  }>;
  cost_breakdown: Array<{
    category: string;
    current_cost: number;
    predicted_cost_6m: number;
    trend: 'rising' | 'stable' | 'falling';
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    potential_savings: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  market_insights: {
    overall_trend: 'rising' | 'stable' | 'falling';
    inflation_forecast: string;
    best_time_to_build: string;
    summary: string;
  };
  savings_if_start_now: number;
  ai_powered: boolean;
  engine: string;
}

export const aiPredictionService = {
  async predict(params: AIPredictionParams): Promise<AIPredictionResult> {
    const response = await api.post('ai/predict-cost/', params);
    return response.data;
  },
};
