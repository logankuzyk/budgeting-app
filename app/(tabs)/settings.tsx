import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  FormControl,
  Input,
  Button,
  ScrollView,
  Alert,
} from 'native-base';
import { getCurrentUser } from '../../lib/firebase/auth';
import { db } from '../../lib/firebase/firestore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function SettingsPage() {
  const user = getCurrentUser();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadApiKey = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setApiKey(userData.geminiApiKey || '');
        }
      } catch (error) {
        console.error('Error loading API key:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadApiKey();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        geminiApiKey: apiKey,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving API key:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box flex={1} bg="gray.50" safeArea>
      <ScrollView keyboardShouldPersistTaps="handled">
        <VStack space={4} p={4}>
          <Heading size="xl">Settings</Heading>

          {showSuccess && (
            <Alert status="success">
              <Alert.Icon />
              <Text fontWeight="semibold">API key saved successfully</Text>
            </Alert>
          )}

          <FormControl>
            <FormControl.Label>Gemini API Key</FormControl.Label>
            <FormControl.HelperText>
              Your Gemini API key is stored securely and used for processing files.
            </FormControl.HelperText>
            <Input
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Enter your Gemini API key"
              secureTextEntry
            />
          </FormControl>

          <Button
            onPress={handleSave}
            isLoading={isSaving}
            isLoadingText="Saving..."
          >
            Save API Key
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
}

