import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Button,
  Text,
  Progress,
  FormControl,
  Alert,
} from 'native-base';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Upload, X } from 'react-native-feather';
import { getCurrentUser } from '../../lib/firebase/auth';
import { uploadFileToStorage, createRawFile } from '../../lib/services/files';
import { getAllAccounts } from '../../lib/services/accounts';
import { FirestoreAccount } from '../../lib/schemas';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/hooks/useRealtimeQuery';
import PickerModal from '../pickers/PickerModal';

interface FileUpload {
  uri: string;
  name: string;
  type: string;
  size: number;
}

interface FileUploaderProps {
  onUploadComplete?: () => void;
  isStatement?: boolean;
}

export default function FileUploader({ onUploadComplete, isStatement = false }: FileUploaderProps) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [accounts, setAccounts] = useState<FirestoreAccount[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStatement) {
      loadAccounts();
    }
  }, [isStatement]);

  const loadAccounts = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const accountsData = await getAllAccounts(user.uid);
      setAccounts(accountsData);
      if (accountsData.length === 1) {
        setSelectedAccount(accountsData[0].id || '');
      }
    } catch (err) {
      setError('Failed to load accounts');
    }
  };

  const pickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name || 'unknown',
          type: asset.mimeType || 'application/pdf',
          size: asset.size || 0,
        }));
        setFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (err) {
      setError('Failed to pick documents');
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
        }));
        setFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (err) {
      setError('Failed to pick images');
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (isStatement && !selectedAccount) {
      setError('Please select an account');
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Convert file to blob
        const response = await fetch(file.uri);
        const blob = await response.blob();

        // Determine file type
        let fileType: 'pdf' | 'csv' | 'image' | 'email' = 'pdf';
        if (file.type.includes('csv')) {
          fileType = 'csv';
        } else if (file.type.includes('image')) {
          fileType = 'image';
        }

        // Upload to storage
        const { storagePath } = await uploadFileToStorage(
          blob,
          file.name,
          isStatement ? selectedAccount : undefined,
          (progress) => {
            setUploadProgress((prev) => ({
              ...prev,
              [i]: progress,
            }));
          }
        );

        // Create rawFile document
        await createRawFile(user.uid, {
          filename: file.name,
          file_type: fileType,
          storage_path: storagePath,
          account_id: isStatement ? selectedAccount : null,
          status: 'pending',
        });
      }

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.rawFiles(user.uid) });
      
      if (isStatement) {
        queryClient.invalidateQueries({ queryKey: queryKeys.statements(user.uid) });
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions(user.uid) });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.receipts(user.uid) });
      }

      setFiles([]);
      setUploadProgress({});
      setUploading(false);
      onUploadComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <Box>
      <VStack space={4}>
        {error && (
          <Alert status="error">
            <Alert.Icon />
            <Text fontWeight="semibold">{error}</Text>
          </Alert>
        )}

        <VStack space={2}>
          <Button onPress={pickDocuments} leftIcon={<Upload width={20} height={20} />}>
            Pick Documents (PDF/CSV)
          </Button>
          <Button onPress={pickImages} variant="outline" leftIcon={<Upload width={20} height={20} />}>
            Pick Images (Receipts)
          </Button>
        </VStack>

        {files.length > 0 && (
          <VStack space={2}>
            <Text fontWeight="semibold">Selected Files ({files.length})</Text>
            {files.map((file, index) => (
              <Box
                key={index}
                bg="gray.100"
                p={3}
                borderRadius="md"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <VStack flex={1}>
                  <Text fontSize="sm" numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {(file.size / 1024).toFixed(2)} KB
                  </Text>
                  {uploadProgress[index] !== undefined && (
                    <Progress value={uploadProgress[index]} mt={2} />
                  )}
                </VStack>
                {!uploading && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => removeFile(index)}
                    leftIcon={<X width={16} height={16} />}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            ))}
          </VStack>
        )}

        {isStatement && accounts.length > 0 && (
          <FormControl>
            <PickerModal
              selectedValue={selectedAccount}
              onValueChange={setSelectedAccount}
              options={accounts.map((account) => ({
                label: account.name,
                value: account.id || '',
              }))}
              label="Select Account"
              placeholder="Choose account"
              isInsideModal={true}
            />
          </FormControl>
        )}

        {files.length > 0 && (
          <Button
            onPress={handleUpload}
            isLoading={uploading}
            isLoadingText="Uploading..."
            isDisabled={isStatement && !selectedAccount}
          >
            Upload {files.length} File{files.length > 1 ? 's' : ''}
          </Button>
        )}
      </VStack>
    </Box>
  );
}
