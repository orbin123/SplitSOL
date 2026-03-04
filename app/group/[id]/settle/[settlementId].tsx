import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function Settlement() {
  const { id, settlementId } = useLocalSearchParams<{ id: string; settlementId: string }>();
  return (
    <View>
      <Text>Settlement {settlementId} - Group {id}</Text>
    </View>
  );
}
