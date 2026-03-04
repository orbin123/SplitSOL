import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text>Group {id}</Text>
    </View>
  );
}
