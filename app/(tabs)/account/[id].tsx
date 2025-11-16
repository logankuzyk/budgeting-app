import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Spinner,
  Center,
  Button,
  HStack,
} from 'native-base';
import { getCurrentUser } from '../../../lib/firebase/auth';
import { getAccount } from '../../../lib/services/accounts';
import { getStatementsByAccount } from '../../../lib/services/statements';
import { getTransactionsByAccount } from '../../../lib/services/transactions';
import { FirestoreAccount, FirestoreStatement, FirestoreTransaction } from '../../../lib/schemas';
import DataTable, { Column } from '../../../components/tables/DataTable';
import { Timestamp } from 'firebase/firestore';

export default function AccountDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = getCurrentUser();
  const [account, setAccount] = useState<FirestoreAccount | null>(null);
  const [statements, setStatements] = useState<FirestoreStatement[]>([]);
  const [transactions, setTransactions] = useState<FirestoreTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'statements'>('transactions');

  const TabButton = ({ value, label, isActive, onPress }: { value: 'transactions' | 'statements', label: string, isActive: boolean, onPress: () => void }) => (
    <Button
      variant={isActive ? 'solid' : 'outline'}
      onPress={onPress}
      flex={1}
    >
      {label}
    </Button>
  );

  useEffect(() => {
    if (!user || !id) return;

    const loadData = async () => {
      try {
        const [accountData, statementsData, transactionsData] = await Promise.all([
          getAccount(user.uid, id),
          getStatementsByAccount(user.uid, id),
          getTransactionsByAccount(user.uid, id),
        ]);

        setAccount(accountData);
        setStatements(statementsData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error loading account data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, id]);

  const transactionColumns: Column<FirestoreTransaction>[] = [
    {
      key: 'date',
      label: 'Date',
      render: (item) => {
        if (!item.date) return <Text>-</Text>;
        const date = item.date instanceof Timestamp
          ? item.date.toDate()
          : item.date instanceof Date
          ? item.date
          : new Date(item.date);
        return <Text>{date.toLocaleDateString()}</Text>;
      },
    },
    {
      key: 'description',
      label: 'Description',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (item) => (
        <Text
          fontWeight="semibold"
          color={item.amount >= 0 ? 'green.600' : 'red.600'}
        >
          {item.amount.toFixed(2)}
        </Text>
      ),
    },
    {
      key: 'merchant',
      label: 'Merchant',
    },
  ];

  const statementColumns: Column<FirestoreStatement>[] = [
    {
      key: 'period_start',
      label: 'Start Date',
      render: (item) => {
        if (!item.period_start) return <Text>-</Text>;
        const date = item.period_start instanceof Timestamp
          ? item.period_start.toDate()
          : item.period_start instanceof Date
          ? item.period_start
          : new Date(item.period_start);
        return <Text>{date.toLocaleDateString()}</Text>;
      },
    },
    {
      key: 'period_end',
      label: 'End Date',
      render: (item) => {
        if (!item.period_end) return <Text>-</Text>;
        const date = item.period_end instanceof Timestamp
          ? item.period_end.toDate()
          : item.period_end instanceof Date
          ? item.period_end
          : new Date(item.period_end);
        return <Text>{date.toLocaleDateString()}</Text>;
      },
    },
    {
      key: 'opening_balance',
      label: 'Opening',
      render: (item) => <Text>{item.opening_balance.toFixed(2)}</Text>,
    },
    {
      key: 'closing_balance',
      label: 'Closing',
      render: (item) => <Text>{item.closing_balance.toFixed(2)}</Text>,
    },
    {
      key: 'is_validated',
      label: 'Status',
      render: (item) => (
        <Text color={item.is_validated ? 'green.600' : 'orange.600'}>
          {item.is_validated ? 'Validated' : 'Pending'}
        </Text>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box flex={1} bg="gray.50" safeArea>
        <Center flex={1}>
          <Spinner size="lg" />
        </Center>
      </Box>
    );
  }

  if (!account) {
    return (
      <Box flex={1} bg="gray.50" safeArea>
        <Center flex={1}>
          <Text>Account not found</Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.50" safeArea>
      <Box flex={1}>
        <VStack space={4} p={4}>
          <VStack space={2}>
            <Heading size="xl">{account.name}</Heading>
            <Text color="gray.600" textTransform="capitalize">
              {account.type} • {account.institution || 'No institution'}
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color={account.balance >= 0 ? 'green.600' : 'red.600'}>
              {account.currency} {account.balance.toFixed(2)}
            </Text>
          </VStack>

          <HStack space={2} mb={4}>
            <TabButton
              value="transactions"
              label="Transactions"
              isActive={activeTab === 'transactions'}
              onPress={() => setActiveTab('transactions')}
            />
            <TabButton
              value="statements"
              label="Statements"
              isActive={activeTab === 'statements'}
              onPress={() => setActiveTab('statements')}
            />
          </HStack>

          {activeTab === 'transactions' ? (
            <DataTable
              data={transactions}
              columns={transactionColumns}
              emptyMessage="No transactions found"
            />
          ) : (
            <DataTable
              data={statements}
              columns={statementColumns}
              emptyMessage="No statements found"
            />
          )}
        </VStack>
      </Box>
    </Box>
  );
}
