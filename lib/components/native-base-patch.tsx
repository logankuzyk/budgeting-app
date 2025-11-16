import { BackHandler } from 'react-native';

/**
 * Polyfill for BackHandler.removeEventListener compatibility
 * 
 * Native-base v3.4.28 uses the deprecated BackHandler.removeEventListener API
 * which doesn't exist in React Native 0.81.5+. This polyfill intercepts
 * calls to removeEventListener and converts them to use the new subscription-based API.
 */
export function applyBackHandlerPatch() {
  // Store handler-to-subscription mappings
  const handlerSubscriptions = new Map<() => boolean, { remove: () => void }>();

  // Override BackHandler.addEventListener to track subscriptions
  const originalAddEventListener = BackHandler.addEventListener.bind(BackHandler);
  BackHandler.addEventListener = function (
    eventName: 'hardwareBackPress',
    handler: () => boolean
  ) {
    const subscription = originalAddEventListener(eventName, handler);
    handlerSubscriptions.set(handler, subscription);
    
    // Return subscription object (standard React Native API)
    return subscription;
  };

  // Add removeEventListener method for backward compatibility
  // This matches handlers by reference and removes their subscriptions
  (BackHandler as any).removeEventListener = function (
    eventName: 'hardwareBackPress',
    handler: () => boolean
  ) {
    const subscription = handlerSubscriptions.get(handler);
    if (subscription) {
      subscription.remove();
      handlerSubscriptions.delete(handler);
    }
  };
}

/**
 * Component that applies the BackHandler patch when mounted
 */
export function BackHandlerPatch() {
  useEffect(() => {
    applyBackHandlerPatch();
  }, []);

  return null;
}

