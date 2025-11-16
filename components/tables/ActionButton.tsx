import { Button, IconButton } from 'native-base';
import { ReactNode } from 'react';

interface ActionButtonProps {
  onPress: () => void;
  icon?: ReactNode;
  label?: string;
  variant?: 'solid' | 'outline' | 'ghost';
  colorScheme?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function ActionButton({
  onPress,
  icon,
  label,
  variant = 'ghost',
  colorScheme = 'blue',
  size = 'sm',
}: ActionButtonProps) {
  if (icon && !label) {
    return (
      <IconButton
        icon={icon}
        onPress={onPress}
        variant={variant}
        colorScheme={colorScheme}
        size={size}
      />
    );
  }

  return (
    <Button
      onPress={onPress}
      leftIcon={icon}
      variant={variant}
      colorScheme={colorScheme}
      size={size}
    >
      {label}
    </Button>
  );
}
