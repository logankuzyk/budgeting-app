import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
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
import { getAllAccounts } from '../../lib/services/accounts';
import { FirestoreStatement, FirestoreAccount } from '../../lib/schemas';
import StatusBadge from '../../components/tables/StatusBadge';
import { Timestamp } from 'firebase/firestore';
import { useRealtimeQuery, queryKeys } from '../../lib/hooks/useRealtimeQuery';
import { orderBy } from 'firebase/firestore';

export default function StatementsPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const [accounts, setAccounts] = useState<Record<string, FirestoreAccount>>({});

  const { data: statements = [], isLoading } = useRealtimeQuery<FirestoreStatement>(
    queryKeys.statements(user?.uid || ''),
    'statements',
    [orderBy('period_start', 'desc')]
  );

  useEffect(() => {
    if (!user) return;

    const loadAccounts = async () => {
      const accountsData = await getAllAccounts(user.uid);
      const accountsMap: Record<string, FirestoreAccount> = {};
      accountsData.forEach((acc) => {
        if (acc.id) accountsMap[acc.id] = acc;
      });
      setAccounts(accountsMap);
    };

    loadAccounts();
  }, [user]);

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
          <Heading size="xl">Statements</Heading>

          {isLoading ? (
            <Center py={8}>
              <Spinner size="lg" />
            </Center>
          ) : statements.length === 0 ? (
            <Box p={4}>
              <Text textAlign="center" color="gray.500">
                No statements found
              </Text>
            </Box>
          ) : (
            <ScrollView>
              <VStack space={3}>
                {statements.map((statement) => (
                  <Pressable key={statement.id}>
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
                              {accounts[statement.account_id]?.name || statement.account_id}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {formatDate(statement.period_start)} - {formatDate(statement.period_end)}
                            </Text>
                            <HStack space={4} mt={1}>
                              <VStack>
                                <Text fontSize="xs" color="gray.500">Opening</Text>
                                <Text fontSize="sm" fontWeight="medium">
                                  ${statement.opening_balance.toFixed(2)}
                                </Text>
                              </VStack>
                              <VStack>
                                <Text fontSize="xs" color="gray.500">Closing</Text>
                                <Text fontSize="sm" fontWeight="medium">
                                  ${statement.closing_balance.toFixed(2)}
                                </Text>
                              </VStack>
                            </HStack>
                          </VStack>
                          <StatusBadge status={statement.is_validated ? 'validated' : 'pending'} />
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
