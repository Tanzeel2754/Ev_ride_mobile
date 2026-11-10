import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { colors, shadows } from '../theme/colors';
import { useTypography } from '../theme/typography';
import type { LoginMethod } from '../types/api';

type Props = {
  value: LoginMethod;
  onChange: (method: LoginMethod) => void;
};

export function LoginMethodToggle({ value, onChange }: Props) {
  const { spacing } = useResponsive();
  const type = useTypography();

  return (
    <View style={[styles.wrap, { marginTop: spacing.md, marginBottom: spacing.sm }]}>
      {(['email', 'sms'] as LoginMethod[]).map((method) => {
        const active = value === method;
        return (
          <Pressable
            key={method}
            onPress={() => onChange(method)}
            style={[styles.item, active ? styles.itemOn : styles.itemOff]}
          >
            <Text
              style={[
                type.h3,
                {
                  color: active ? colors.textOnGreen : colors.textSecondary,
                  fontSize: 14,
                },
              ]}
            >
              {method === 'email' ? 'Email' : 'SMS'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  itemOn: {
    backgroundColor: colors.green,
    ...shadows.sm,
  },
  itemOff: {
    backgroundColor: 'transparent',
  },
});
