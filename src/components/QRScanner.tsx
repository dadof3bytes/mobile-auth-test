import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface QRScannerProps {
  onScan: (data: any) => void;
  onCancel: () => void;
}

export function QRScanner({ onScan, onCancel }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Request camera permissions
  useEffect(() => {
    (async () => {
      if (permission?.granted === undefined) {
        await requestPermission();
      }
      setHasPermission(permission?.granted ?? false);
    })();
  }, [permission]);

  // Handle QR code scanning
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    try {
      // Try to parse the QR code data as JSON
      const parsedData = JSON.parse(data);
      
      // Validate that it contains the expected fields
      if (
        parsedData.pairingCode &&
        parsedData.deviceSessionId &&
        parsedData.apiUrl &&
        parsedData.endpoint
      ) {
        onScan(parsedData);
      } else {
        alert('Invalid QR code format. Missing required fields. Please scan a valid pairing code.');
        setScanned(false);
      }
    } catch (error) {
      alert('Invalid QR code. Please scan a valid pairing code.');
      setScanned(false);
    }
  };

  // Handle different permission states
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <Text style={styles.subText}>
          Camera access is required to scan the QR code.
        </Text>
        <Button title="Go Back" onPress={onCancel} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr']
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.unfilled} />
          <View style={styles.rowContainer}>
            <View style={styles.unfilled} />
            <View style={styles.scanner} />
            <View style={styles.unfilled} />
          </View>
          <View style={styles.unfilled} />
        </View>
        
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            Scan the QR code displayed on the PickQik web app
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={onCancel}
          />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  subText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  unfilled: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    flex: 2,
  },
  scanner: {
    flex: 6,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructions: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});