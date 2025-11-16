import {
  Box,
  Text,
  VStack,
  Pressable,
  Actionsheet,
  useDisclose,
} from 'native-base';
import { ChevronDown } from 'react-native-feather';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useCallback } from 'react';
import { useModalOverlay } from '../modals/EditModal';

export interface PickerOption {
  label: string;
  value: string;
}

interface PickerModalProps {
  selectedValue?: string;
  onValueChange: (value: string) => void;
  options: PickerOption[];
  placeholder?: string;
  label?: string;
  isDisabled?: boolean;
  isInsideModal?: boolean;
}

export default function PickerModal({
  selectedValue,
  onValueChange,
  options,
  placeholder = 'Select an option',
  label,
  isDisabled = false,
  isInsideModal = false,
}: PickerModalProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  const overlayContext = useModalOverlay();

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const handleSelect = useCallback((value: string) => {
    onValueChange(value);
    onClose();
  }, [onValueChange, onClose]);

  // Register/unregister overlay when inside modal
  useEffect(() => {
    if (isInsideModal && overlayContext) {
      if (isOpen) {
        overlayContext.registerOverlay(
          <>
            {/* Backdrop */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={onClose}
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            />
            {/* Picker Content */}
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              bg="white"
              borderTopLeftRadius="lg"
              borderTopRightRadius="lg"
              maxHeight="50%"
              shadow={9}
            >
              <Box px={4} py={3} borderBottomWidth={1} borderBottomColor="gray.200">
                <Text fontSize="md" fontWeight="semibold">
                  Select {label || 'Option'}
                </Text>
              </Box>
              <VStack>
                {options.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    _pressed={{ bg: 'gray.100' }}
                  >
                    <Box px={4} py={3}>
                      <Text
                        fontSize="md"
                        fontWeight={selectedValue === option.value ? 'semibold' : 'normal'}
                        color={selectedValue === option.value ? 'blue.600' : 'gray.900'}
                      >
                        {option.label}
                      </Text>
                    </Box>
                  </Pressable>
                ))}
              </VStack>
            </Box>
          </>
        );
      } else {
        overlayContext.unregisterOverlay();
      }
    }
    return () => {
      if (isInsideModal && overlayContext) {
        overlayContext.unregisterOverlay();
      }
    };
  }, [isOpen, isInsideModal, overlayContext, label, options, selectedValue, handleSelect]);

  return (
    <>
      <VStack space={1}>
        {label && (
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            {label}
          </Text>
        )}
        <Pressable
          onPress={() => !isDisabled && onOpen()}
          isDisabled={isDisabled}
        >
          <Box
            bg="gray.50"
            borderWidth={1}
            borderColor="gray.300"
            borderRadius="md"
            px={3}
            py={2}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            opacity={isDisabled ? 0.5 : 1}
          >
            <Text
              fontSize="md"
              color={selectedOption ? 'gray.900' : 'gray.500'}
              flex={1}
            >
              {selectedOption?.label || placeholder}
            </Text>
            <ChevronDown width={20} height={20} color="#9CA3AF" />
          </Box>
        </Pressable>
      </VStack>


      {!isInsideModal && (
        <Actionsheet isOpen={isOpen} onClose={onClose}>
          <Actionsheet.Content>
            <Box px={4} py={3} borderBottomWidth={1} borderBottomColor="gray.200">
              <Text fontSize="md" fontWeight="semibold">
                Select {label || 'Option'}
              </Text>
            </Box>
            {options.map((option) => (
              <Actionsheet.Item
                key={option.value}
                onPress={() => handleSelect(option.value)}
              >
                <Text
                  fontSize="md"
                  fontWeight={selectedValue === option.value ? 'semibold' : 'normal'}
                  color={selectedValue === option.value ? 'blue.600' : 'gray.900'}
                >
                  {option.label}
                </Text>
              </Actionsheet.Item>
            ))}
          </Actionsheet.Content>
        </Actionsheet>
      )}
    </>
  );
}

