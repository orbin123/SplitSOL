import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function AddExpense() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text>Add Expense - Group {id}</Text>
    </View>
  );
}
