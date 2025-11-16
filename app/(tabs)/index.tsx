import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Center,
  Spinner,
  Alert,
  ScrollView,
  HStack,
} from 'native-base';
import { Upload } from 'react-native-feather';
import { getCurrentUser } from '../../lib/firebase/auth';
import { useRealtimeQuery, queryKeys } from '../../lib/hooks/useRealtimeQuery';
import { getAllAccounts } from '../../lib/services/accounts';
import { FirestoreAccount } from '../../lib/schemas';
import { orderBy } from 'firebase/firestore';
import EditModal from '../../components/modals/EditModal';
import FileUploader from '../../components/upload/FileUploader';

export default function Dashboard() {
  const router = useRouter();
  const user = getCurrentUser();
  const [accounts, setAccounts] = useState<FirestoreAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'statement' | 'receipt' | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadAccounts = async () => {
      try {
        const accountsData = await getAllAccounts(user.uid);
        setAccounts(accountsData);
      } catch (error) {
        console.error('Error loading accounts:', error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, [user]);

  const handleUpload = () => {
    if (accounts.length === 0) {
      // Show account creation prompt
      router.push('/accounts');
    } else {
      // Show upload modal
      setShowUploadModal(true);
    }
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    setUploadType(null);
  };

  return (
    <Box flex={1} bg="gray.50" safeArea>
      <ScrollView>
        <VStack space={6} p={4}>
          <Heading size="xl" mt={4}>
            Dashboard
          </Heading>

          {isLoadingAccounts ? (
            <Center py={8}>
              <Spinner size="lg" />
            </Center>
          ) : accounts.length === 0 ? (
            <Alert status="info" mb={4}>
              <Alert.Icon />
              <Text fontWeight="semibold">No accounts found</Text>
              <Text>
                Create an account to start tracking your finances.
              </Text>
            </Alert>
          ) : (
            <VStack space={4}>
              <Text fontSize="lg" fontWeight="semibold">
                Your Accounts ({accounts.length})
              </Text>
              {accounts.map((account) => (
                <Box
                  key={account.id}
                  bg="white"
                  p={4}
                  borderRadius="md"
                  shadow={1}
                >
                  <VStack space={2}>
                    <Text fontSize="md" fontWeight="semibold">
                      {account.name}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {account.type} • {account.institution || 'No institution'}
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" color={account.balance >= 0 ? 'green.600' : 'red.600'}>
                      {account.currency} {account.balance.toFixed(2)}
                    </Text>
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}

          <Button
            size="lg"
            leftIcon={<Upload width={20} height={20} />}
            onPress={handleUpload}
            isDisabled={accounts.length === 0}
          >
            Upload Statement or Receipt
          </Button>

          {accounts.length === 0 && (
            <Button
              variant="outline"
              size="lg"
              onPress={() => router.push('/accounts')}
            >
              Create Your First Account
            </Button>
          )}
        </VStack>
      </ScrollView>

      <EditModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadType(null);
        }}
        onSave={() => {}}
        title={uploadType ? (uploadType === 'statement' ? 'Upload Statement' : 'Upload Receipt') : 'Upload File'}
        isLoading={false}
      >
        {!uploadType ? (
          <VStack space={4}>
            <Text fontSize="md" color="gray.600">
              What would you like to upload?
            </Text>
            <Button
              size="lg"
              onPress={() => setUploadType('statement')}
              leftIcon={<Upload width={20} height={20} />}
            >
              Upload Statement (PDF/CSV)
            </Button>
            <Button
              size="lg"
              variant="outline"
              onPress={() => setUploadType('receipt')}
              leftIcon={<Upload width={20} height={20} />}
            >
              Upload Receipt (Image)
            </Button>
          </VStack>
        ) : (
          <VStack space={4}>
            <Button
              variant="ghost"
              size="sm"
              alignSelf="flex-start"
              onPress={() => setUploadType(null)}
            >
              ← Back
            </Button>
            <FileUploader
              isStatement={uploadType === 'statement'}
              onUploadComplete={handleUploadComplete}
            />
          </VStack>
        )}
      </EditModal>
    </Box>
  );
}
