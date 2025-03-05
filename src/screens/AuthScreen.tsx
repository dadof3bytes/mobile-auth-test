import React, { useState } from 'react';
import { View, StyleSheet, Text, Button, ActivityIndicator } from 'react-native';
import { QRScanner } from '../components/QRScanner';
import { AuthService } from '../services/auth';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start QR code scanning
  const startScanning = () => {
    setIsScanning(true);
    setError(null);
  };

  // Cancel QR code scanning
  const cancelScanning = () => {
    setIsScanning(false);
  };

  // Handle successful QR code scan
  const handleScan = async (data: any) => {
    setIsScanning(false);
    setIsAuthenticating(true);
    setError(null);
    
    try {
      // Validate the pairing with the server
      const success = await AuthService.validatePairing(data);
      
      if (success) {
        onAuthenticated();
      } else {
        setError('Failed to authenticate device. Please try again.');
      }
    } catch (error) {
      setError('An error occurred during authentication. Please try again.');
      console.error('Authentication error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Show QR scanner when scanning is active
  if (isScanning) {
    return <QRScanner onScan={handleScan} onCancel={cancelScanning} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>PickQik Mobile</Text>
        <Text style={styles.subtitle}>
          Scan a QR code from the PickQik web app to connect your device
        </Text>
        
        {error && <Text style={styles.error}>{error}</Text>}
        
        {isAuthenticating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Authenticating...</Text>
          </View>
        ) : (
          <Button
            title="Scan QR Code"
            onPress={startScanning}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#6b7280',
  },
  error: {
    color: '#ef4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#4b5563',
  },
});