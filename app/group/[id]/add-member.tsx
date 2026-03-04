import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function AddMember() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text>Add Member - Group {id}</Text>
    </View>
  );
}
