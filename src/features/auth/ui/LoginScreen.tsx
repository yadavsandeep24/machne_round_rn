import { AxiosError } from 'axios';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { userMessage } from '../../../core/error/appError';
import { mapError } from '../../../core/network/http';
import { Button } from '../../../core/ui/StateViews';
import { colors, spacing } from '../../../ui/theme';
import { useAuth } from './AuthContext';

export function LoginScreen() {
  const { signIn, expired } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({});

  const submit = async () => {
    if (submitting) return; // double tap
    const next = {
      username: username.trim() ? undefined : 'Enter your username',
      password: password.length >= 6 ? undefined : password ? 'At least 6 characters' : 'Enter your password',
    };
    setErrors(next);
    if (next.username || next.password) return;
    setSubmitting(true);
    try {
      await signIn(username.trim(), password);
    } catch (e) {
      // dummyjson answers 400 for bad credentials; never say which field was wrong.
      const status = e instanceof AxiosError ? e.response?.status : undefined;
      setErrors({ form: status === 400 || status === 401 ? 'Wrong username or password' : userMessage(mapError(e)) });
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign in</Text>
        {expired ? <Text style={styles.muted}>Your session expired. Please sign in again.</Text> : null}
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          accessibilityLabel="Username"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          autoComplete="username"
          editable={!submitting}
          style={styles.input}
        />
        {errors.username ? <Text style={styles.error}>{errors.username}</Text> : null}
        <View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            accessibilityLabel="Password"
            secureTextEntry={hidden}
            textContentType="password"
            autoComplete="current-password"
            editable={!submitting}
            onSubmitEditing={submit}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((h) => !h)}
            style={styles.eye}
          >
            <Text>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        </View>
        {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
        {errors.form ? (
          <Text style={styles.error} accessibilityRole="alert">
            {errors.form}
          </Text>
        ) : null}
        {submitting ? <ActivityIndicator /> : <Button title="Sign in" onPress={submit} />}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  title: { fontSize: 28, fontWeight: '700' },
  muted: { color: colors.muted },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: spacing.md, fontSize: 16 },
  eye: { position: 'absolute', right: spacing.md, top: 0, bottom: 0, justifyContent: 'center' },
  error: { color: colors.error },
});
