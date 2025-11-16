import {
  Box,
  VStack,
  Heading,
  Text,
  Spinner,
  Center,
  ScrollView,
  Pressable,
  HStack,
} from 'native-base';
import { getCurrentUser } from '../../lib/firebase/auth';
import { FirestoreReceipt } from '../../lib/schemas';
import { Timestamp } from 'firebase/firestore';
import { useRealtimeQuery, queryKeys } from '../../lib/hooks/useRealtimeQuery';
import { orderBy } from 'firebase/firestore';

export default function ReceiptsPage() {
  const user = getCurrentUser();

  const { data: receipts = [], isLoading } = useRealtimeQuery<FirestoreReceipt>(
    queryKeys.receipts(user?.uid || ''),
    'receipts',
    [orderBy('date', 'desc')]
  );

  const formatDate = (date: Timestamp | Date | string | null | undefined) => {
    if (!date) return '-';
    const dateObj = date instanceof Timestamp
      ? date.toDate()
      : date instanceof Date
      ? date
      : typeof date === 'string'
      ? new Date(date)
      : null;
    if (!dateObj) return '-';
    return dateObj.toLocaleDateString();
  };

  return (
    <Box flex={1} bg="gray.50" safeArea>
      <Box flex={1}>
        <VStack space={4} p={4}>
          <Heading size="xl">Receipts</Heading>

          {isLoading ? (
            <Center py={8}>
              <Spinner size="lg" />
            </Center>
          ) : receipts.length === 0 ? (
            <Box p={4}>
              <Text textAlign="center" color="gray.500">
                No receipts found
              </Text>
            </Box>
          ) : (
            <ScrollView>
              <VStack space={3}>
                {receipts.map((receipt) => (
                  <Pressable key={receipt.id}>
                    <Box
                      bg="white"
                      p={4}
                      borderRadius="md"
                      shadow={1}
                    >
                      <VStack space={2}>
                        <HStack justifyContent="space-between" alignItems="flex-start">
                          <VStack flex={1} space={1}>
                            <Text fontSize="md" fontWeight="semibold">
                              {receipt.merchant || 'Unknown Merchant'}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {receipt.items?.length || 0} item{(receipt.items?.length || 0) !== 1 ? 's' : ''}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {formatDate(receipt.date)}
                            </Text>
                          </VStack>
                          <Text fontSize="lg" fontWeight="bold" color="gray.900">
                            ${receipt.total_amount.toFixed(2)}
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </Pressable>
                ))}
              </VStack>
            </ScrollView>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
