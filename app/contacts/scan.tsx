import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { QRScanner } from '@/components/wallet/QRScanner';
import { parseContactQrPayload } from '@/utils/contactQr';

export default function ScanContactScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const contacts = useAppStore((s) => s.contacts);
  const addContact = useAppStore((s) => s.addContact);
  const [isHandling, setIsHandling] = useState(false);

  const handleScan = (data: string) => {
    if (isHandling) return false;

    setIsHandling(true);

    const payload = parseContactQrPayload(data);
    if (!payload) {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid SplitSOL contact.',
        [{ text: 'OK', onPress: () => setIsHandling(false) }],
      );
      return false;
    }

    if (payload.wallet === user.walletAddress) {
      Alert.alert(
        'This is your QR code',
        'You cannot add yourself as a contact.',
        [{ text: 'OK', onPress: () => setIsHandling(false) }],
      );
      return false;
    }

    const existingContact = contacts.find(
      (contact) => contact.walletAddress === payload.wallet,
    );
    const contactId =
      existingContact?.id ??
      addContact({
        name: payload.name,
        walletAddress: payload.wallet,
        isFavorite: false,
      });

    Alert.alert(
      existingContact ? 'Already in contacts' : 'Contact added',
      existingContact
        ? `${payload.name} is already in your contact book.`
        : `${payload.name} has been added to your contacts.`,
      [
        {
          text: 'View Contact',
          onPress: () => router.replace(`/contacts/${contactId}` as any),
        },
        {
          text: 'Done',
          onPress: () => router.replace('/contacts' as any),
        },
      ],
    );
    return true;
  };

  return (
    <QRScanner
      onScan={handleScan}
      onClose={() => router.back()}
      hint="Scan a SplitSOL contact QR code"
    />
  );
}
