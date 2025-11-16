import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Box, VStack, Heading, Text, Button, Center } from 'native-base';
import { onAuthStateChange, getCurrentUser } from '../lib/firebase/auth';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const user = getCurrentUser();
    if (user) {
      router.replace('/(tabs)');
    }

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        router.replace('/(tabs)');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <Box flex={1} bg="white" safeArea>
      <Center flex={1} px={8}>
        <VStack space={8} alignItems="center" w="100%">
          <VStack space={4} alignItems="center">
            <Heading size="2xl" textAlign="center">
              Budgeting App
            </Heading>
            <Text fontSize="lg" textAlign="center" color="gray.600">
              Track your finances with AI-powered transaction extraction
            </Text>
          </VStack>

          <VStack space={4} w="100%" maxW="400px">
            <Text fontSize="md" fontWeight="semibold" textAlign="center">
              Features:
            </Text>
            <VStack space={2}>
              <Text>• Automated transaction extraction from statements</Text>
              <Text>• Receipt scanning and itemization</Text>
              <Text>• Smart transaction-receipt matching</Text>
              <Text>• Category management and budgeting</Text>
              <Text>• Real-time account balance tracking</Text>
            </VStack>
          </VStack>

          <Button
            size="lg"
            w="100%"
            maxW="400px"
            onPress={() => router.push('/(auth)/login')}
          >
            Get Started
          </Button>
        </VStack>
      </Center>
    </Box>
  );
}

