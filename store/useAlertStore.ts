import { create } from 'zustand';

export interface AlertButton {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface AlertStateData {
    title: string;
    message: string;
    buttons?: AlertButton[];
}

interface AlertStore {
    isVisible: boolean;
    alertData: AlertStateData | null;
    showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
    hideAlert: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
    isVisible: false,
    alertData: null,
    showAlert: (title, message, buttons) =>
        set({
            isVisible: true,
            alertData: { title, message, buttons },
        }),
    hideAlert: () =>
        set({
            isVisible: false,
            alertData: null,
        }),
}));

export const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
    useAlertStore.getState().showAlert(title, message, buttons);
};
