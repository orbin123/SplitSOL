import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { QRScanner } from '@/components/ui/QRScanner';
import { SplitSolQrPayload } from '@/utils/memberQr';

export default function ScanMemberScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const members = useAppStore((s) => s.members);
  const addMember = useAppStore((s) => s.addMember);
  const [isHandling, setIsHandling] = useState(false);

  const handleScan = (payload: SplitSolQrPayload) => {
    if (isHandling) return false;

    setIsHandling(true);

    if (payload.type === 'group_invite') {
      router.replace(`/group/invite/${payload.groupId}` as any);
      return true;
    }

    if (payload.wallet === user.walletAddress) {
      Alert.alert(
        'This is your QR code',
        'You cannot add yourself as a member.',
        [{ text: 'OK', onPress: () => setIsHandling(false) }],
      );
      return false;
    }

    const existingMember = members.find(
      (member) => member.walletAddress === payload.wallet,
    );
    const memberId =
      existingMember?.id ??
      addMember({
        name: payload.name,
        walletAddress: payload.wallet,
        isFavorite: false,
      });

    Alert.alert(
      existingMember ? 'Already in members' : 'Member added',
      existingMember
        ? `${payload.name} is already in your member list.`
        : `${payload.name} has been added to your members.`,
      [
        {
          text: 'View Member',
          onPress: () => router.replace(`/members/${memberId}` as any),
        },
        {
          text: 'Done',
          onPress: () => router.replace('/members' as any),
        },
      ],
    );
    return true;
  };

  return (
    <QRScanner
      onScan={handleScan}
      onClose={() => router.back()}
      hint="Point camera at a member's QR code"
    />
  );
}
