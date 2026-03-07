import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONT, SPACING } from '@/utils/constants';
import { Button } from '@/components/ui/Button';
import { SplitSolQrPayload, parseSplitSolQrPayload } from '@/utils/contactQr';

interface QRScannerProps {
  onScan: (payload: SplitSolQrPayload) => boolean | Promise<boolean>;
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

    const payload = parseSplitSolQrPayload(data);
    if (!payload) {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid SplitSOL QR.',
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setHasScanned(true);
    const accepted = await Promise.resolve(onScan(payload));

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
        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.75}
          >
            <Ionicons name="close" size={22} color={COLORS.text.white} />
          </TouchableOpacity>
        )}
        <View style={styles.scanFrame} />
        <Text style={styles.hint}>{hint}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  closeButton: {
    position: 'absolute',
    top: 70,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  hint: {
    position: 'absolute',
    bottom: 100,
    color: 'rgba(255,255,255,0.95)',
    fontSize: FONT.size.md,
    textAlign: 'center',
    paddingHorizontal: SPACING.xxl,
  },
});
