import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import BrandLogo from '../src/components/BrandLogo';
import { colors, spacing } from '../src/theme/colors';
import { typography } from '../src/theme/typography';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <BrandLogo size="md" />
        <Text style={styles.title}>Page not found</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
  },
  link: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
  },
  linkText: {
    ...typography.button,
    color: colors.green,
  },
});
