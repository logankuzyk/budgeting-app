import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Spinner,
  Center,
  Fab,
  Alert,
  ScrollView,
  Pressable,
  FormControl,
  Input,
} from 'native-base';
import { Plus } from 'react-native-feather';
import { getCurrentUser } from '../../lib/firebase/auth';
import { getAllAccounts, deleteAccount } from '../../lib/services/accounts';
import { FirestoreAccount } from '../../lib/schemas';
import EditModal from '../../components/modals/EditModal';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AccountSchema } from '../../lib/schemas';
import { z } from 'zod';
import { useRealtimeQuery, queryKeys } from '../../lib/hooks/useRealtimeQuery';
import { orderBy } from 'firebase/firestore';
import PickerModal, { PickerOption } from '../../components/pickers/PickerModal';

const AccountFormSchema = AccountSchema.omit({ metadata: true }).required({
  balance: true,
  currency: true,
});

export default function AccountsPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FirestoreAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: accounts = [], isLoading, error: queryError } = useRealtimeQuery<FirestoreAccount>(
    queryKeys.accounts(user?.uid || ''),
    'accounts',
    [orderBy('name', 'asc')]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof AccountFormSchema>>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: {
      name: '',
      type: 'checking',
      institution: '',
      account_number_last4: '',
      balance: 0,
      currency: 'USD',
    },
  });

  useEffect(() => {
    if (editingAccount) {
      reset({
        name: editingAccount.name,
        type: editingAccount.type,
        institution: editingAccount.institution || '',
        account_number_last4: editingAccount.account_number_last4 || '',
        balance: editingAccount.balance,
        currency: editingAccount.currency,
      });
    } else {
      reset();
    }
  }, [editingAccount, reset]);

  const onSubmit = async (data: z.infer<typeof AccountFormSchema>) => {
    if (!user) return;

    try {
      if (editingAccount) {
        // Update account
        const { updateAccount } = await import('../../lib/services/accounts');
        await updateAccount(user.uid, editingAccount.id || '', data);
      } else {
        // Create account
        const { createAccount } = await import('../../lib/services/accounts');
        await createAccount(user.uid, data);
      }
      setShowCreateModal(false);
      setEditingAccount(null);
      reset();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!user) return;
    setIsDeleting(accountId);
    try {
      await deleteAccount(user.uid, accountId);
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const accountTypeOptions: PickerOption[] = [
    { label: 'Checking', value: 'checking' },
    { label: 'Savings', value: 'savings' },
    { label: 'Credit', value: 'credit' },
    { label: 'Investment', value: 'investment' },
    { label: 'Loan', value: 'loan' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <Box flex={1} bg="gray.50" safeArea>
      <Box flex={1}>
        <VStack space={4} p={4}>
          <Heading size="xl">Accounts</Heading>

          {queryError ? (
            <Alert status="error" mb={4}>
              <Alert.Icon />
              <Text fontWeight="semibold">Error loading accounts</Text>
              <Text fontSize="sm">{queryError.message}</Text>
              <Text fontSize="xs" mt={2} color="gray.600">
                Please check that Firestore is enabled in Firebase Console and that your Firestore rules allow access.
              </Text>
            </Alert>
          ) : isLoading ? (
            <Center py={8}>
              <Spinner size="lg" />
            </Center>
          ) : accounts.length === 0 ? (
            <Box p={4}>
              <Text textAlign="center" color="gray.500">
                No accounts found. Create your first account!
              </Text>
            </Box>
          ) : (
            <ScrollView>
              <VStack space={3}>
                {accounts.map((account) => (
                  <Pressable
                    key={account.id}
                    onPress={() => router.push(`/account/${account.id}`)}
                  >
                    <Box
                      bg="white"
                      p={4}
                      borderRadius="md"
                      shadow={1}
                    >
                      <VStack space={2}>
                        <Text fontSize="md" fontWeight="semibold">
                          {account.name}
                        </Text>
                        <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                          {account.type} • {account.institution || 'No institution'}
                        </Text>
                        <Text
                          fontSize="lg"
                          fontWeight="bold"
                          color={account.balance >= 0 ? 'green.600' : 'red.600'}
                        >
                          {account.currency} {account.balance.toFixed(2)}
                        </Text>
                      </VStack>
                    </Box>
                  </Pressable>
                ))}
              </VStack>
            </ScrollView>
          )}
        </VStack>
      </Box>

      <Fab
        icon={<Plus width={24} height={24} />}
        onPress={() => {
          setEditingAccount(null);
          setShowCreateModal(true);
        }}
      />

      <EditModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAccount(null);
          reset();
        }}
        onSave={handleSubmit(onSubmit)}
        title={editingAccount ? 'Edit Account' : 'Create Account'}
        isLoading={isSubmitting}
      >
        <FormControl isInvalid={!!errors.name}>
          <FormControl.Label>Account Name</FormControl.Label>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur, ref } }) => (
              <Input 
                ref={ref}
                value={value || ''} 
                onChangeText={onChange}
                onBlur={onBlur}
                returnKeyType="next"
                blurOnSubmit={false}
                autoCapitalize="words"
                editable={true}
              />
            )}
          />
          <FormControl.ErrorMessage>{errors.name?.message}</FormControl.ErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.type}>
          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <PickerModal
                selectedValue={value}
                onValueChange={onChange}
                options={accountTypeOptions}
                label="Account Type"
                placeholder="Select account type"
                isInsideModal={true}
              />
            )}
          />
          {errors.type && (
            <Text fontSize="xs" color="error.500" mt={1}>
              {errors.type.message}
            </Text>
          )}
        </FormControl>

        <FormControl>
          <FormControl.Label>Institution</FormControl.Label>
          <Controller
            control={control}
            name="institution"
            render={({ field: { onChange, value, onBlur, ref } }) => (
              <Input 
                ref={ref}
                value={value || ''} 
                onChangeText={onChange}
                onBlur={onBlur}
                returnKeyType="next"
                blurOnSubmit={false}
                autoCapitalize="words"
                editable={true}
              />
            )}
          />
        </FormControl>

        <FormControl>
          <FormControl.Label>Last 4 Digits</FormControl.Label>
          <Controller
            control={control}
            name="account_number_last4"
            render={({ field: { onChange, value, onBlur, ref } }) => (
              <Input 
                ref={ref}
                value={value || ''} 
                onChangeText={onChange}
                onBlur={onBlur}
                maxLength={4}
                returnKeyType="next"
                blurOnSubmit={false}
                keyboardType="numeric"
                editable={true}
              />
            )}
          />
        </FormControl>

        <FormControl isInvalid={!!errors.balance}>
          <FormControl.Label>Balance</FormControl.Label>
          <Controller
            control={control}
            name="balance"
            render={({ field: { onChange, value, onBlur, ref } }) => (
              <Input
                ref={ref}
                value={value?.toString() || '0'}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                onBlur={onBlur}
                keyboardType="numeric"
                returnKeyType="next"
                blurOnSubmit={false}
                editable={true}
              />
            )}
          />
        </FormControl>

        <FormControl>
          <FormControl.Label>Currency</FormControl.Label>
          <Controller
            control={control}
            name="currency"
            render={({ field: { onChange, value, onBlur, ref } }) => (
              <Input 
                ref={ref}
                value={value || ''} 
                onChangeText={onChange}
                onBlur={onBlur}
                maxLength={3}
                returnKeyType="done"
                blurOnSubmit={true}
                autoCapitalize="characters"
                editable={true}
              />
            )}
          />
        </FormControl>
      </EditModal>
    </Box>
  );
}
