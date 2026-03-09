import React, { useEffect, useRef } from 'react';
import {
    Animated,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { COLORS, FONT, SPACING } from '@/utils/constants';
import { truncateAddress } from '@/utils/formatters';

const formatDateTime = (date: Date) =>
    date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

export default function SettleSuccessScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        txId: string;
        groupId: string;
        amount: string;
        from: string;
        to: string;
        groupName: string;
        groupEmoji: string;
        method: string;
        recipientWallet: string;
    }>();

    const amount = parseFloat(params.amount || '0');
    const timestamp = new Date();

    // Animations
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
        }).start();

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                delay: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 600,
                delay: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [scaleAnim, fadeAnim, slideUpAnim]);

    const handleShare = async () => {
        const shareText = [
            '✅ Settlement Complete — SplitSOL',
            '',
            `💰 Amount: ${amount.toFixed(2)} USDC`,
            `👤 From: ${params.from}`,
            `👤 To: ${params.to}`,
            `📁 Group: ${params.groupEmoji} ${params.groupName}`,
            `🔗 Method: ${params.method === 'autopay' ? 'AutoPay (SOL → USDC)' : 'Direct USDC Transfer'}`,
            `📝 Memo: SplitSOL | ${params.groupName} | ${params.from} → ${params.to} | ${amount.toFixed(2)} USDC`,
            `⏱ Time: ${formatDateTime(timestamp)}`,
            `🌐 Network: Solana Devnet`,
            `🆔 Tx: ${params.txId}`,
            '',
            'Powered by SplitSOL ⚡',
        ].join('\n');

        try {
            await Share.share({
                message: shareText,
                title: 'SplitSOL Settlement Receipt',
            });
        } catch {
            // User cancelled
        }
    };

    const goHome = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.replace('/(tabs)/home');
    };

    return (
        <LinearGradient
            colors={['#7C3AED', '#A855F7', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop: insets.top + SPACING.xxxl,
                        paddingBottom: insets.bottom + SPACING.xxxl,
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Checkmark animation */}
                <View style={styles.hero}>
                    <Animated.View
                        style={[
                            styles.glowCircle,
                            { transform: [{ scale: scaleAnim }] },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.checkCircle,
                            { transform: [{ scale: scaleAnim }] },
                        ]}
                    >
                        <Ionicons name="checkmark" size={44} color="#FFFFFF" />
                    </Animated.View>

                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        }}
                    >
                        <Text style={styles.title}>Settlement Complete!</Text>
                        <Text style={styles.amount}>
                            {amount.toFixed(2)} USDC
                        </Text>
                        <Text style={styles.toLabel}>to {params.to}</Text>
                    </Animated.View>
                </View>

                {/* Transaction details card */}
                <Animated.View
                    style={[
                        styles.detailsCard,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        },
                    ]}
                >
                    <DetailRow
                        label="Amount"
                        value={`${amount.toFixed(2)} USDC`}
                    />
                    <View style={styles.divider} />
                    <DetailRow
                        label="Group"
                        value={`${params.groupEmoji} ${params.groupName}`}
                    />
                    <View style={styles.divider} />
                    <DetailRow
                        label="From → To"
                        value={`${params.from} → ${params.to}`}
                    />
                    <View style={styles.divider} />
                    <DetailRow
                        label="Method"
                        value={
                            params.method === 'autopay'
                                ? 'AutoPay (SOL → USDC)'
                                : 'Direct USDC'
                        }
                    />
                    <View style={styles.divider} />
                    <DetailRow
                        label="Network fee"
                        value="~0.000005 SOL"
                    />
                    <View style={styles.divider} />
                    <DetailRow
                        label="Time"
                        value={formatDateTime(timestamp)}
                    />
                    <View style={styles.divider} />
                    <DetailRow
                        label="Status"
                        value={
                            <Badge label="Confirmed" variant="success" size="sm" />
                        }
                    />
                    <View style={styles.divider} />
                    <DetailRow
                        label="Network"
                        value={<Badge label="Devnet" variant="devnet" size="sm" />}
                    />
                    {params.recipientWallet ? (
                        <>
                            <View style={styles.divider} />
                            <DetailRow
                                label="Recipient"
                                value={truncateAddress(params.recipientWallet, 4)}
                            />
                        </>
                    ) : null}
                    <View style={styles.divider} />
                    <DetailRow
                        label="Transaction ID"
                        value={truncateAddress(params.txId || '', 6)}
                    />
                </Animated.View>

                {/* Action buttons */}
                <Animated.View
                    style={[
                        styles.actions,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={goHome}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="home-outline" size={20} color="#7C3AED" />
                        <Text style={styles.primaryBtnText}>Go to Homepage</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => void handleShare()}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.secondaryBtnText}>Share Details</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </LinearGradient>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    const isString = typeof value === 'string';
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <View style={styles.detailValueWrap}>
                {isString ? (
                    <Text style={styles.detailValue}>{value}</Text>
                ) : (
                    value
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
    },
    hero: {
        alignItems: 'center',
        marginBottom: 32,
    },
    glowCircle: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(16, 185, 129, 0.25)',
        top: 0,
    },
    checkCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: SPACING.sm,
        letterSpacing: -0.3,
    },
    amount: {
        color: '#FFFFFF',
        fontSize: 40,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: -1,
    },
    toLabel: {
        color: 'rgba(255, 255, 255, 0.75)',
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: SPACING.xs,
    },
    detailsCard: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 28,
        paddingVertical: 8,
        paddingHorizontal: 20,
        marginBottom: SPACING.xxl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
    },
    detailLabel: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    detailValueWrap: {
        flex: 1.2,
        alignItems: 'flex-end',
    },
    detailValue: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
    },
    actions: {
        width: '100%',
        gap: 14,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        paddingVertical: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    primaryBtnText: {
        color: '#7C3AED',
        fontSize: 17,
        fontWeight: '800',
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 28,
        paddingVertical: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    secondaryBtnText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },
});
