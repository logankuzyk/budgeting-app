import { Modal, Button, VStack, Text, Box, HStack } from 'native-base';
import { FirestoreTransaction, FirestoreReceipt } from '../../lib/schemas';
import { Timestamp } from 'firebase/firestore';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (transactionId: string) => void;
  receipt: FirestoreReceipt;
  candidates: Array<{
    transaction: FirestoreTransaction;
    score: number;
  }>;
}

export default function MatchModal({
  isOpen,
  onClose,
  onSelect,
  receipt,
  candidates,
}: MatchModalProps) {
  const formatDate = (date: Timestamp | Date | string | null) => {
    if (!date) return '-';
    const d = date instanceof Timestamp
      ? date.toDate()
      : date instanceof Date
      ? date
      : new Date(date);
    return d.toLocaleDateString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Content>
        <Modal.CloseButton />
        <Modal.Header>Match Receipt to Transaction</Modal.Header>
        <Modal.Body>
          <VStack space={4}>
            <Box>
              <Text fontWeight="semibold" mb={2}>Receipt Details</Text>
              <Text>Merchant: {receipt.merchant}</Text>
              <Text>Date: {formatDate(receipt.date)}</Text>
              <Text>Amount: ${receipt.total_amount.toFixed(2)}</Text>
            </Box>

            <Box>
              <Text fontWeight="semibold" mb={2}>Possible Matches</Text>
              {candidates.length === 0 ? (
                <Text color="gray.500">No matching transactions found</Text>
              ) : (
                <VStack space={2}>
                  {candidates.map((candidate, index) => (
                    <Box
                      key={candidate.transaction.id}
                      bg="gray.100"
                      p={3}
                      borderRadius="md"
                    >
                      <HStack justifyContent="space-between" alignItems="center">
                        <VStack flex={1}>
                          <Text fontWeight="semibold">
                            {candidate.transaction.description}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {formatDate(candidate.transaction.date)} • 
                            ${Math.abs(candidate.transaction.amount).toFixed(2)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Match Score: {(candidate.score * 100).toFixed(0)}%
                          </Text>
                        </VStack>
                        <Button
                          size="sm"
                          onPress={() => {
                            if (candidate.transaction.id) {
                              onSelect(candidate.transaction.id);
                            }
                          }}
                        >
                          Select
                        </Button>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onPress={onClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}

