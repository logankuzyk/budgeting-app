import { Box, ScrollView, Text, HStack, Button, VStack, Pressable } from 'native-base';
import { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from 'react-native-feather';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: keyof T | string, direction: 'asc' | 'desc') => void;
  sortKey?: keyof T | string;
  sortDirection?: 'asc' | 'desc';
  onRowPress?: (item: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends { id?: string }>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection,
  onRowPress,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const handleSort = (key: keyof T | string) => {
    if (!onSort) return;
    const direction =
      sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, direction);
  };

  if (data.length === 0) {
    return (
      <Box p={4}>
        <Text textAlign="center" color="gray.500">
          {emptyMessage}
        </Text>
      </Box>
    );
  }

  return (
    <ScrollView horizontal nestedScrollEnabled={true}>
      <VStack>
        {/* Header */}
        <HStack bg="gray.100" p={2} borderBottomWidth={1}>
          {columns.map((column) => (
            <Box key={String(column.key)} flex={1} minW={100} px={2}>
              <HStack space={2} alignItems="center">
                <Text fontWeight="semibold" fontSize="sm">{column.label}</Text>
                {column.sortable && onSort && (
                  <Pressable onPress={() => handleSort(column.key)}>
                    {sortKey === column.key ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp width={16} height={16} />
                      ) : (
                        <ArrowDown width={16} height={16} />
                      )
                    ) : (
                      <Box w={16} />
                    )}
                  </Pressable>
                )}
              </HStack>
            </Box>
          ))}
        </HStack>
        {/* Rows */}
        {data.map((item, index) => (
          <Pressable
            key={item.id || index}
            onPress={onRowPress ? () => onRowPress(item) : undefined}
          >
            <HStack bg={index % 2 === 0 ? 'white' : 'gray.50'} p={2} borderBottomWidth={1}>
              {columns.map((column) => (
                <Box key={String(column.key)} flex={1} minW={100} px={2}>
                  {column.render
                    ? column.render(item)
                    : <Text fontSize="sm">{String(item[column.key as keyof T] ?? '')}</Text>}
                </Box>
              ))}
            </HStack>
          </Pressable>
        ))}
      </VStack>
    </ScrollView>
  );
}
