import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Center,
  Spinner,
} from 'native-base';
import { signInWithGoogle } from '../../lib/firebase/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} bg="white" safeArea>
      <Center flex={1} px={8}>
        <VStack space={8} alignItems="center" w="100%" maxW="400px">
          <VStack space={4} alignItems="center">
            <Heading size="xl" textAlign="center">
              Welcome Back
            </Heading>
            <Text fontSize="md" textAlign="center" color="gray.600">
              Sign in to continue managing your budget
            </Text>
          </VStack>

          {error && (
            <Box
              bg="red.50"
              borderColor="red.200"
              borderWidth={1}
              borderRadius="md"
              p={4}
              w="100%"
            >
              <Text color="red.600" fontWeight="semibold">
                {error}
              </Text>
            </Box>
          )}

          <Button
            size="lg"
            w="100%"
            onPress={handleGoogleSignIn}
            isLoading={loading}
            isLoadingText="Signing in..."
            leftIcon={loading ? <Spinner size="sm" /> : undefined}
          >
            Sign in with Google
          </Button>

          <Text fontSize="xs" color="gray.500" textAlign="center">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </VStack>
      </Center>
    </Box>
  );
}

