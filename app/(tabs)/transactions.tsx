import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Spinner,
  Center,
  FormControl,
  ScrollView,
  Pressable,
  HStack,
} from 'native-base';
import { getCurrentUser } from '../../lib/firebase/auth';
import { getAllAccounts } from '../../lib/services/accounts';
import { FirestoreTransaction, FirestoreAccount } from '../../lib/schemas';
import { Timestamp } from 'firebase/firestore';
import { useRealtimeQuery, queryKeys } from '../../lib/hooks/useRealtimeQuery';
import { orderBy, where } from 'firebase/firestore';
import PickerModal, { PickerOption } from '../../components/pickers/PickerModal';

export default function TransactionsPage() {
  const user = getCurrentUser();
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [accounts, setAccounts] = useState<FirestoreAccount[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadAccounts = async () => {
      const accountsData = await getAllAccounts(user.uid);
      setAccounts(accountsData);
    };

    loadAccounts();
  }, [user]);

  const constraints = selectedAccount === 'all'
    ? [orderBy('date', 'desc')]
    : [where('account_id', '==', selectedAccount), orderBy('date', 'desc')];

  const { data: transactions = [], isLoading } = useRealtimeQuery<FirestoreTransaction>(
    queryKeys.transactions(user?.uid || '', { accountId: selectedAccount === 'all' ? undefined : selectedAccount }),
    'transactions',
    constraints
  );

  const accountOptions: PickerOption[] = [
    { label: 'All Accounts', value: 'all' },
    ...accounts.map((account) => ({
      label: account.name,
      value: account.id || '',
    })),
  ];

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
          <Heading size="xl">Transactions</Heading>

          <FormControl>
            <PickerModal
              selectedValue={selectedAccount}
              onValueChange={setSelectedAccount}
              options={accountOptions}
              label="Filter by Account"
              placeholder="Select account"
            />
          </FormControl>

          {isLoading ? (
            <Center py={8}>
              <Spinner size="lg" />
            </Center>
          ) : transactions.length === 0 ? (
            <Box p={4}>
              <Text textAlign="center" color="gray.500">
                No transactions found
              </Text>
            </Box>
          ) : (
            <ScrollView>
              <VStack space={3}>
                {transactions.map((transaction) => (
                  <Pressable key={transaction.id}>
                    <Box
                      bg="white"
                      p={4}
                      borderRadius="md"
                      shadow={1}
                    >
                      <VStack space={2}>
                        <HStack justifyContent="space-between" alignItems="flex-start">
                          <VStack flex={1} space={1}>
                            <Text fontSize="md" fontWeight="semibold" numberOfLines={2}>
                              {transaction.description || 'No description'}
                            </Text>
                            {transaction.merchant && (
                              <Text fontSize="sm" color="gray.600">
                                {transaction.merchant}
                              </Text>
                            )}
                            <Text fontSize="xs" color="gray.500">
                              {formatDate(transaction.date)}
                            </Text>
                          </VStack>
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color={transaction.amount >= 0 ? 'green.600' : 'red.600'}
                          >
                            {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}
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
