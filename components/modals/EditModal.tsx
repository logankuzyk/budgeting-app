import { Button, VStack, Box, Text, HStack, ScrollView } from 'native-base';
import { Modal, Platform, KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { ReactNode, createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  children: ReactNode;
  isLoading?: boolean;
}

// Context for registering overlays
const OverlayContext = createContext<{
  registerOverlay: (overlay: ReactNode) => void;
  unregisterOverlay: () => void;
} | null>(null);

export const useModalOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    return null;
  }
  return context;
};

export default function EditModal({
  isOpen,
  onClose,
  onSave,
  title,
  children,
  isLoading = false,
}: EditModalProps) {
  const [overlay, setOverlay] = useState<ReactNode>(null);

  const registerOverlay = useCallback((overlayContent: ReactNode) => {
    setOverlay(overlayContent);
  }, []);

  const unregisterOverlay = useCallback(() => {
    setOverlay(null);
  }, []);

  const contextValue = useMemo(
    () => ({ registerOverlay, unregisterOverlay }),
    [registerOverlay, unregisterOverlay]
  );

  // Reset overlay when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOverlay(null);
    }
  }, [isOpen]);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <OverlayContext.Provider value={contextValue}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Box
            flex={1}
            bg="black:alpha.50"
            justifyContent="center"
            alignItems="center"
            px={4}
          >
            <Box
              bg="white"
              rounded="lg"
              width="100%"
              maxWidth="600px"
              maxHeight="90%"
              shadow={9}
            >
              {/* Header */}
              <HStack
                justifyContent="space-between"
                alignItems="center"
                px={4}
                py={3}
                borderBottomWidth={1}
                borderBottomColor="gray.200"
              >
                <Text fontSize="lg" fontWeight="semibold">
                  {title}
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={onClose}
                  _text={{ fontSize: 'lg' }}
                >
                  ✕
                </Button>
              </HStack>

              {/* Body */}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
                nestedScrollEnabled={true}
                px={4}
                py={4}
              >
                <VStack space={4}>{children}</VStack>
              </ScrollView>

              {/* Footer */}
              <HStack
                justifyContent="flex-end"
                space={2}
                px={4}
                py={3}
                borderTopWidth={1}
                borderTopColor="gray.200"
              >
                <Button variant="ghost" onPress={onClose}>
                  Cancel
                </Button>
                <Button onPress={onSave} isLoading={isLoading}>
                  Save
                </Button>
              </HStack>
            </Box>
          </Box>
          {/* Overlay container - renders at Modal level */}
          {overlay && (
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {overlay}
            </View>
          )}
        </KeyboardAvoidingView>
      </OverlayContext.Provider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Removed zIndex - React Native Modal already renders on top by default
    // Native Base Actionsheet Portal needs to render above the Modal
  },
});

