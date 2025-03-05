import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Define types
interface PairingData {
  pairingCode: string;
  deviceSessionId: string;
  expiresAt: string;
  apiUrl: string;
}

interface AuthResponse {
  deviceId: string;
  refreshToken: string;
}

export class AuthService {
  private static readonly DEVICE_ID_KEY = 'pickqik.deviceId';
  private static readonly TOKEN_KEY = 'pickqik.refreshToken';
  private static readonly API_URL_KEY = 'pickqik.apiUrl';

  // Validate the pairing code with the server
  static async validatePairing(data: PairingData): Promise<boolean> {
    try {
      // Get device name (you can customize this)
      const deviceName = await this.getDeviceName();
      
      // Send validation request to the server
      const response = await axios.post(`${data.apiUrl}/api/devices/validate`, {
        pairingCode: data.pairingCode,
        deviceSessionId: data.deviceSessionId,
        deviceName: deviceName
      });
      
      // Store authentication data securely
      if (response.data.deviceId && response.data.refreshToken) {
        await this.saveAuthData(
          response.data.deviceId,
          response.data.refreshToken,
          data.apiUrl
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  // Get a device name to display in the web interface
  static async getDeviceName(): Promise<string> {
    // You can customize this to get the actual device model
    // For now, we'll use a generic name
    return 'PickQik Mobile App';
  }

  // Save authentication data securely
  static async saveAuthData(
    deviceId: string,
    refreshToken: string,
    apiUrl: string
  ): Promise<void> {
    await SecureStore.setItemAsync(this.DEVICE_ID_KEY, deviceId);
    await SecureStore.setItemAsync(this.TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(this.API_URL_KEY, apiUrl);
  }

  // Check if the user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(this.TOKEN_KEY);
    return !!token;
  }

  // Get the stored authentication data
  static async getAuthData(): Promise<{
    deviceId: string;
    refreshToken: string;
    apiUrl: string;
  } | null> {
    const deviceId = await SecureStore.getItemAsync(this.DEVICE_ID_KEY);
    const refreshToken = await SecureStore.getItemAsync(this.TOKEN_KEY);
    const apiUrl = await SecureStore.getItemAsync(this.API_URL_KEY);

    if (deviceId && refreshToken && apiUrl) {
      return { deviceId, refreshToken, apiUrl };
    }
    
    return null;
  }

  // Log out by clearing stored credentials
  static async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(this.DEVICE_ID_KEY);
    await SecureStore.deleteItemAsync(this.TOKEN_KEY);
    await SecureStore.deleteItemAsync(this.API_URL_KEY);
  }
}