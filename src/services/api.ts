import axios, { AxiosInstance } from 'axios';
import { AuthService } from './auth';

export class ApiService {
  private static instance: AxiosInstance | null = null;

  // Initialize the API client with authentication
  static async getClient(): Promise<AxiosInstance> {
    if (this.instance) {
      return this.instance;
    }

    const authData = await AuthService.getAuthData();
    if (!authData) {
      throw new Error('Not authenticated');
    }

    this.instance = axios.create({
      baseURL: authData.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': authData.deviceId,
        'Authorization': `Bearer ${authData.refreshToken}`,
      },
    });

    // Add response interceptor for handling authentication errors
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // If the error is due to authentication (401)
        if (error.response && error.response.status === 401) {
          // Clear authentication and force re-login
          await AuthService.logout();
          // You would typically navigate to the auth screen here
          // but we'll let the app handle that through the auth state
        }
        return Promise.reject(error);
      }
    );

    return this.instance;
  }

  // Reset the API client (useful after logout)
  static resetClient(): void {
    this.instance = null;
  }
}