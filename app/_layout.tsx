import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { NativeBaseProvider } from 'native-base';
import { onAuthStateChange, getCurrentUser } from '../lib/firebase/auth';
import { Spinner, Center, Box } from 'native-base';
import { QueryProvider } from '../lib/providers/QueryProvider';
import { applyBackHandlerPatch } from '../lib/components/native-base-patch';

// Apply BackHandler patch before native-base components mount
applyBackHandlerPatch();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to tabs if authenticated
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  if (isLoading) {
    return (
      <NativeBaseProvider>
        <QueryProvider>
          <Box flex={1} bg="white">
            <Center flex={1}>
              <Spinner size="lg" />
            </Center>
          </Box>
        </QueryProvider>
      </NativeBaseProvider>
    );
  }

  const screenOptions = { headerShown: false };

  return (
    <NativeBaseProvider>
      <QueryProvider>
        <Stack screenOptions={screenOptions}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryProvider>
    </NativeBaseProvider>
  );
}

