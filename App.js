import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, ScrollView } from 'react-native';
import { QRScanner } from './src/components/QRScanner';

export default function App() {
  const [scanning, setScanning] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [authStatus, setAuthStatus] = useState('idle'); // 'idle', 'authenticating', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [authToken, setAuthToken] = useState(null);

  const handleScan = (data) => {
    setScanData(data);
    setScanning(false);
    
    // Check if the QR code has expired
    if (data.expiresAt) {
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();
      
      if (now > expiresAt) {
        setAuthStatus('error');
        setErrorMessage('This QR code has expired. Please request a new one from the web application.');
        return;
      }
    }
    
    // Start authentication process when QR code is scanned
    authenticateDevice(data);
  };

  const handleCancel = () => {
    setScanning(false);
  };

  // Authenticate with the scanned data by making a real API request
  const authenticateDevice = async (data) => {
    try {
      setAuthStatus('authenticating');
      
      // Check if we have the required data from the QR code
      if (!data.apiUrl || !data.pairingCode || !data.deviceSessionId || !data.endpoint) {
        throw new Error('Missing required authentication data in QR code');
      }
      
      // Construct the full API URL with the endpoint from the QR code
      const fullApiUrl = `${data.apiUrl}${data.endpoint}`;
      console.log(`Authenticating with ${fullApiUrl}`);
      
      // Make a real API request to the authentication server
      const response = await fetch(fullApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          pairingCode: data.pairingCode,
          deviceSessionId: data.deviceSessionId,
          deviceName: 'Mobile Test Device'
        }),
      });
      
      // Log response status
      console.log(`Response status: ${response.status}`);
      
      let responseData;
      const responseText = await response.text();
      
      try {
        // Try to parse the response as JSON
        responseData = JSON.parse(responseText);
      } catch (error) {
        // If JSON parsing fails, log the actual response content
        console.log('Failed to parse JSON response:', responseText.substring(0, 100));
        throw new Error(`Server returned invalid JSON. Response: ${responseText.substring(0, 100)}...`);
      }
      
      // Check if the request was successful
      if (!response.ok) {
        // The response is already JSON, so we can use it directly
        const errorData = responseData;
        throw new Error(errorData.error || errorData.message || `Authentication failed with status: ${response.status}`);
      }
      
      console.log('Authentication successful:', responseData);
      
      // Store the authentication token
      setAuthToken(responseData);
      setAuthStatus('success');
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthStatus('error');
      setErrorMessage(error.message || 'Authentication failed. Please try again.');
    }
  };

  // Verify the token with the server
  const verifyToken = async () => {
    if (!authToken || !authToken.refreshToken || !scanData || !scanData.apiUrl) {
      setAuthStatus('error');
      setErrorMessage('No valid token to verify');
      return;
    }
    
    try {
      setAuthStatus('authenticating');
      
      // Construct the verification URL
      const verifyUrl = `${scanData.apiUrl}/api/mobile/verify`;
      console.log(`Verifying token with ${verifyUrl}`);
      
      // Make a request to verify the token
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: authToken.refreshToken,
          deviceId: authToken.deviceId
        }),
      });
      
      let responseData;
      const responseText = await response.text();
      
      try {
        // Try to parse the response as JSON
        responseData = JSON.parse(responseText);
      } catch (error) {
        console.log('Failed to parse verification JSON response:', responseText.substring(0, 100));
        throw new Error(`Server returned invalid JSON for verification. Response: ${responseText.substring(0, 100)}...`);
      }
      
      // Check if the request was successful
      if (!response.ok) {
        // The response is already JSON, so we can use it directly
        const errorData = responseData;
        throw new Error(errorData.error || errorData.message || `Token verification failed with status: ${response.status}`);
      }
      
      console.log('Token verification successful');
      alert('Token verification successful! Your token is valid.');
      
      // Update the token if a new one was provided
      if (responseData.refreshToken) {
        setAuthToken({
          ...authToken,
          ...responseData
        });
      }
      
      setAuthStatus('success');
    } catch (error) {
      console.error('Token verification error:', error);
      setAuthStatus('error');
      setErrorMessage(error.message || 'Token verification failed. Your token may have expired.');
    }
  };

  // Reset the authentication process
  const resetAuth = () => {
    setScanData(null);
    setAuthToken(null);
    setAuthStatus('idle');
    setErrorMessage('');
  };

  if (scanning) {
    return <QRScanner onScan={handleScan} onCancel={handleCancel} />;
  }

  return (
    <View style={styles.container}>
      {scanData ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          {authStatus === 'authenticating' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066cc" />
              <Text style={styles.loadingText}>Authenticating device...</Text>
            </View>
          ) : authStatus === 'success' ? (
            <View style={styles.successContainer}>
              <Text style={styles.title}>Authentication Successful!</Text>
              <Text style={styles.successText}>Your device has been successfully paired.</Text>
              
              <View style={styles.dataContainer}>
                <Text style={styles.sectionTitle}>QR Code Data</Text>
                <Text style={styles.dataLabel}>Pairing Code:</Text>
                <Text style={styles.dataValue}>{scanData.pairingCode}</Text>
                
                <Text style={styles.dataLabel}>API URL:</Text>
                <Text style={styles.dataValue}>{scanData.apiUrl}</Text>
              </View>
              
              {authToken && (
                <View style={styles.tokenContainer}>
                  <Text style={styles.sectionTitle}>Authentication Token</Text>
                  
                  {authToken.deviceId && (
                    <>
                      <Text style={styles.dataLabel}>Device ID:</Text>
                      <Text style={styles.dataValue}>{authToken.deviceId}</Text>
                    </>
                  )}
                  
                  {authToken.refreshToken && (
                    <>
                      <Text style={styles.dataLabel}>Refresh Token:</Text>
                      <Text style={styles.tokenValue}>{authToken.refreshToken}</Text>
                    </>
                  )}
                </View>
              )}
              
              <View style={styles.buttonContainer}>
                <Button title="Verify Token" onPress={verifyToken} />
                <View style={styles.buttonSpacer} />
                <Button title="Done" onPress={resetAuth} color="#666" />
              </View>
            </View>
          ) : authStatus === 'error' ? (
            <View style={styles.errorContainer}>
              <Text style={styles.title}>Authentication Failed</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Button title="Try Again" onPress={() => setScanning(true)} />
              <Button title="Go Back" onPress={resetAuth} color="#666" />
            </View>
          ) : (
            <View style={styles.resultContainer}>
              <Text style={styles.title}>QR Code Scanned</Text>
              <Text style={styles.dataText}>Pairing Code: {scanData.pairingCode}</Text>
              <Text style={styles.dataText}>API URL: {scanData.apiUrl}</Text>
              <Button title="Authenticate" onPress={() => authenticateDevice(scanData)} />
              <View style={styles.buttonSpacer} />
              <Button title="Scan Again" onPress={() => {
                resetAuth();
                setScanning(true);
              }} color="#666" />
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.startContainer}>
          <Text style={styles.title}>Mobile Authentication Test</Text>
          <Text style={styles.subtitle}>Scan a QR code to authenticate your device</Text>
          <Button title="Start Scanning" onPress={() => setScanning(true)} />
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scrollView: {
    width: '100%',
  },
  scrollViewContent: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  startContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 10,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 10,
  },
  dataContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
  },
  tokenContainer: {
    width: '100%',
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#91d5ff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  dataText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 10,
  },
  dataValue: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  tokenValue: {
    fontSize: 14,
    marginBottom: 10,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 4,
  },
  successText: {
    fontSize: 16,
    color: '#28a745',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  buttonSpacer: {
    width: 10,
  },
});
