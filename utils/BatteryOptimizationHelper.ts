import * as IntentLauncher from 'expo-intent-launcher';
import * as Device from 'expo-device';
import { Platform, Alert, Linking } from 'react-native';

export const checkBatteryOptimizations = async () => {
    if (Platform.OS !== 'android') return;

    // Note: There isn't a direct "check" API in Expo for this specific permission status
    // so we usually show a prompt explaining why it's needed if it's the first time
    // or if the user is experiencing issues.
    // However, we can use IntentLauncher to take them to the settings page.
};

export const requestIgnoreBatteryOptimizations = async () => {
    if (Platform.OS !== 'android') return;

    try {
        const pkg = Device.packageName;
        await IntentLauncher.startActivityAsync(
            IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
            {
                data: `package:${pkg}`,
            }
        );
    } catch (e) {
        // If the direct intent fails (some devices), fall back to the generic settings page
        Alert.alert(
            'Battery Optimization',
            'To ensure the timer runs reliably in the background, please disable battery optimization for this app in the next screen.',
            [
                {
                    text: 'Open Settings',
                    onPress: () => {
                        IntentLauncher.startActivityAsync(
                            IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
                        );
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    }
};
