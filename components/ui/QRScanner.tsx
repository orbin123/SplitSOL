import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONT, SPACING } from '@/utils/constants';
import { Button } from '@/components/ui/Button';
import { SplitSolQrPayload, parseSplitSolQrPayload } from '@/utils/memberQr';

const SCAN_SIZE = 280;
const CORNER_LENGTH = 40;
const CORNER_THICKNESS = 3;
const PURPLE = '#7C3AED';

interface QRScannerProps {
  onScan: (payload: SplitSolQrPayload) => boolean | Promise<boolean>;
  onClose?: () => void;
  hint?: string;
  onEnterManually?: () => void;
}

function CornerBrackets() {
  return (
    <View style={cornerStyles.frame} pointerEvents="none">
      <View style={[cornerStyles.corner, cornerStyles.tl]}>
        <View style={[cornerStyles.line, cornerStyles.h, cornerStyles.hTop]} />
        <View style={[cornerStyles.line, cornerStyles.v, cornerStyles.vLeft]} />
      </View>
      <View style={[cornerStyles.corner, cornerStyles.tr]}>
        <View style={[cornerStyles.line, cornerStyles.h, cornerStyles.hTop, { right: 0, left: undefined }]} />
        <View style={[cornerStyles.line, cornerStyles.v, cornerStyles.vLeft, { right: 0, left: undefined }]} />
      </View>
      <View style={[cornerStyles.corner, cornerStyles.bl]}>
        <View style={[cornerStyles.line, cornerStyles.h, cornerStyles.hBottom]} />
        <View style={[cornerStyles.line, cornerStyles.v, cornerStyles.vLeft, { bottom: 0, top: undefined }]} />
      </View>
      <View style={[cornerStyles.corner, cornerStyles.br]}>
        <View style={[cornerStyles.line, cornerStyles.h, cornerStyles.hBottom, { right: 0, left: undefined }]} />
        <View style={[cornerStyles.line, cornerStyles.v, cornerStyles.vLeft, { right: 0, left: undefined, bottom: 0, top: undefined }]} />
      </View>
    </View>
  );
}

const cornerStyles = StyleSheet.create({
  frame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_LENGTH,
    height: CORNER_LENGTH,
  },
  line: {
    position: 'absolute',
    backgroundColor: PURPLE,
    borderRadius: CORNER_THICKNESS / 2,
  },
  h: {
    width: CORNER_LENGTH,
    height: CORNER_THICKNESS,
  },
  v: {
    width: CORNER_THICKNESS,
    height: CORNER_LENGTH,
  },
  hTop: { top: 0, left: 0 },
  hBottom: { bottom: 0, left: 0 },
  vLeft: { top: 0, left: 0 },
  tl: { top: 0, left: 0 },
  tr: { top: 0, right: 0 },
  bl: { bottom: 0, left: 0 },
  br: { bottom: 0, right: 0 },
});

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onClose,
  hint = "Point camera at a member's QR code",
  onEnterManually,
}) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const { width, height } = Dimensions.get('window');
  const centerY = height / 2;
  const centerX = width / 2;
  const halfScan = SCAN_SIZE / 2;
  const topOverlayH = Math.max(0, centerY - halfScan);
  const bottomOverlayH = Math.max(0, height - centerY - halfScan);
  const sideOverlayW = Math.max(0, (width - SCAN_SIZE) / 2);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!data || hasScanned) return;

    const payload = parseSplitSolQrPayload(data);
    if (!payload) {
      setHasScanned(true);
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid SplitSOL invite. You can scan again or close the scanner.',
        onClose
          ? [
              {
                text: 'Close',
                style: 'cancel',
                onPress: () => {
                  setHasScanned(false);
                  onClose();
                },
              },
              {
                text: 'Scan Again',
                onPress: () => setHasScanned(false),
              },
            ]
          : [
              {
                text: 'Scan Again',
                onPress: () => setHasScanned(false),
              },
            ],
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
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={hasScanned ? undefined : handleBarCodeScanned}
      />
      {/* Dark overlay with cutout - 4 rectangles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={[styles.overlayRect, { top: 0, left: 0, right: 0, height: topOverlayH }]} />
        <View style={[styles.overlayRect, { bottom: 0, left: 0, right: 0, height: bottomOverlayH }]} />
        <View
          style={[
            styles.overlayRect,
            {
              top: topOverlayH,
              bottom: height - bottomOverlayH,
              left: 0,
              width: sideOverlayW,
            },
          ]}
        />
        <View
          style={[
            styles.overlayRect,
            {
              top: topOverlayH,
              bottom: height - bottomOverlayH,
              right: 0,
              width: sideOverlayW,
            },
          ]}
        />
      </View>

      {/* Top title */}
      <View style={[styles.topBar, { top: insets.top + SPACING.md }]}>
        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.75}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Scan QR Code</Text>
        <TouchableOpacity
          style={styles.flashButton}
          onPress={() => setFlashOn((v) => !v)}
          activeOpacity={0.75}
        >
          <Ionicons
            name={flashOn ? 'flash' : 'flash-outline'}
            size={24}
            color={COLORS.text.white}
          />
        </TouchableOpacity>
      </View>

      {/* Center scan area with corner brackets */}
      <View style={styles.scanArea}>
        <CornerBrackets />
      </View>

      {/* Hint below scan area */}
      <Text style={styles.hint}>{hint}</Text>

      {/* Bottom: Enter Manually */}
      <View style={[styles.bottomBar, { bottom: insets.bottom + SPACING.lg }]}>
        {onEnterManually ? (
          <TouchableOpacity onPress={onEnterManually} activeOpacity={0.75}>
            <Text style={styles.enterManual}>Enter Manually</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  overlayRect: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: COLORS.text.white,
    fontSize: 24,
    fontWeight: '300',
  },
  title: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: FONT.weight.bold,
  },
  flashButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -SCAN_SIZE / 2,
    marginTop: -SCAN_SIZE / 2,
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: SCAN_SIZE / 2 + SPACING.lg,
    color: COLORS.text.white,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  enterManual: {
    color: COLORS.text.white,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    textDecorationLine: 'underline',
  },
});
