import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { COLORS, FONT, SPACING } from '@/utils/constants';

interface QRScannerProps {
  onScan: (data: string) => boolean | Promise<boolean>;
  onClose?: () => void;
  hint?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onClose,
  hint = 'Scan a SplitSOL QR code',
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!data || hasScanned) return;

    setHasScanned(true);
    const accepted = await Promise.resolve(onScan(data));

    if (accepted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    setHasScanned(false);
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Preparing camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera access is required</Text>
        <Text style={styles.permissionText}>
          Allow camera permission to scan another SplitSOL member&apos;s QR code.
        </Text>
        <Button
          title="Allow Camera Access"
          onPress={() => {
            void requestPermission();
          }}
          size="lg"
          style={styles.permissionButton}
        />
        {onClose && (
          <Button
            title="Cancel"
            onPress={onClose}
            variant="ghost"
            size="sm"
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={hasScanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.hint}>{hint}</Text>
        {onClose && (
          <View style={styles.closeButtonWrap}>
            <Button title="Close" onPress={onClose} variant="secondary" />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    backgroundColor: COLORS.bg.primary,
  },
  permissionTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
  },
  permissionText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  permissionButton: {
    width: '100%',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.sm,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
  },
  hint: {
    position: 'absolute',
    bottom: 80,
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONT.size.md,
    textAlign: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  closeButtonWrap: {
    position: 'absolute',
    top: 70,
    right: 24,
  },
});