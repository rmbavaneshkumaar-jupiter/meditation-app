import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'user_name';

export const [UserProvider, useUser] = createContextHook(() => {
    const [username, setUsername] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUsername();
    }, []);

    const loadUsername = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setUsername(stored);
            }
        } catch (error) {
            console.error('Failed to load username:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveUsername = async (name: string) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, name);
            setUsername(name);
        } catch (error) {
            console.error('Failed to save username:', error);
        }
    };

    return {
        username,
        isLoading,
        saveUsername,
    };
});
