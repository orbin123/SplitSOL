import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function GroupInvite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text>Invite - Group {id}</Text>
    </View>
  );
}
