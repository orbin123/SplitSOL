import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card } from '@/components/ui/Card';
import { useAlertStore, AlertButton } from '@/store/useAlertStore';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';

export function CustomAlertModal() {
    const { isVisible, alertData, hideAlert } = useAlertStore();

    if (!alertData) return null;

    const { title, message, buttons } = alertData;

    const defaultButtons: AlertButton[] = [{ text: 'OK', onPress: hideAlert }];
    const actionButtons = buttons && buttons.length > 0 ? buttons : defaultButtons;

    const handlePress = (onPress?: () => void) => {
        hideAlert();
        if (onPress) {
            // Add a small delay so the modal closes before the action fires, preventing UI freezing
            setTimeout(() => {
                onPress();
            }, 50);
        }
    };

    const hasDestructive = actionButtons.some((b) => b.style === 'destructive');
    const titleColor = hasDestructive ? COLORS.bg.danger : COLORS.bg.dark;

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={hideAlert}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={hideAlert}
            >
                <View style={styles.modalContent}>
                    <TouchableOpacity activeOpacity={1}>
                        <Card style={styles.alertCard}>
                            <View style={styles.header}>
                                <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
                                <TouchableOpacity onPress={hideAlert} style={styles.closeBtn}>
                                    <Ionicons name="close" size={24} color={COLORS.text.tertiary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.message}>{message}</Text>

                            <View style={styles.buttonRow}>
                                {actionButtons.map((btn, index) => {
                                    const isCancel = btn.style === 'cancel';
                                    const isDestructive = btn.style === 'destructive';

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.actionBtn,
                                                isCancel && styles.cancelBtn,
                                                isDestructive && styles.destructiveBtn,
                                                !isCancel && !isDestructive && styles.defaultBtn,
                                            ]}
                                            onPress={() => handlePress(btn.onPress)}
                                        >
                                            <Text
                                                style={[
                                                    styles.actionBtnText,
                                                    isCancel && styles.cancelBtnText,
                                                    isDestructive && styles.destructiveBtnText,
                                                    !isCancel && !isDestructive && styles.defaultBtnText,
                                                ]}
                                            >
                                                {btn.text}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </Card>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
    },
    alertCard: {
        padding: SPACING.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: FONT.size.xl,
        fontWeight: FONT.weight.bold,
    },
    closeBtn: {
        padding: SPACING.xs,
    },
    message: {
        color: COLORS.text.secondary,
        fontSize: FONT.size.md,
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.sm,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: {
        fontSize: FONT.size.md,
        fontWeight: FONT.weight.bold,
    },
    cancelBtn: {
        backgroundColor: COLORS.bg.tertiary,
    },
    cancelBtnText: {
        color: COLORS.text.primary,
        fontSize: FONT.size.md,
        fontWeight: FONT.weight.semibold,
    },
    destructiveBtn: {
        backgroundColor: COLORS.bg.danger,
    },
    destructiveBtnText: {
        color: COLORS.text.white,
        fontSize: FONT.size.md,
        fontWeight: FONT.weight.bold,
    },
    defaultBtn: {
        backgroundColor: COLORS.bg.accent,
    },
    defaultBtnText: {
        color: '#FFFFFF',
        fontSize: FONT.size.md,
        fontWeight: FONT.weight.bold,
    },
});
