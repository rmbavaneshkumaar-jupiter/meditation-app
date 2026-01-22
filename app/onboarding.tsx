import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { COLORS } from '@/constants/meditation';

export default function OnboardingScreen() {
    const [name, setName] = useState('');
    const { saveUsername } = useUser();
    const router = useRouter();

    const handleNext = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter your name to continue.');
            return;
        }

        await saveUsername(name.trim());
        router.replace('/(tabs)');
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Welcome to Meditation Sound Repeater</Text>
                <Text style={styles.subtitle}>Let's get to know you better.</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>What should we call you?</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        placeholderTextColor={COLORS.textLight}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: COLORS.surface,
        padding: 32,
        borderRadius: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        width: '100%',
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.secondary,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.surface,
    },
});
