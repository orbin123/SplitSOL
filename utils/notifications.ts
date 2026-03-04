import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request permission (call on app startup)
export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// Send a local notification
export const notifyExpenseAdded = async (
  groupName: string,
  description: string,
  amount: string,
  paidBy: string,
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${groupName}: New Expense`,
      body: `${paidBy} paid ${amount} for "${description}"`,
      sound: true,
    },
    trigger: null,  // Immediately
  });
};

export const notifySettlementReceived = async (
  fromName: string,
  amount: string,
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Settlement Received!',
      body: `${fromName} sent you ${amount}`,
      sound: true,
    },
    trigger: null,
  });
};

export const notifySettlementReminder = async (
  groupName: string,
  amount: string,
  toName: string,
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Friendly Reminder',
      body: `You owe ${amount} to ${toName} in "${groupName}"`,
      sound: true,
    },
    trigger: {
      type: 'timeInterval',
      seconds: 86400,     // 24 hours later
      repeats: false,
    } as any,
  });
};