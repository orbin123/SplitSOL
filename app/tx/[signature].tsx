import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function TransactionDetail() {
  const { signature } = useLocalSearchParams<{ signature: string }>();
  return (
    <View>
      <Text>Transaction {signature}</Text>
    </View>
  );
}
