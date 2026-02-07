import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { appRoutes } from '@app/routes';
import { login, register } from '@shared/auth/authApi';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';

const authSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().optional(),
});

type AuthForm = {
  email: string;
  password: string;
  confirmPassword?: string;
};

interface AuthFormCardProps {
  mode: 'login' | 'register';
}

function AuthFormCard({ mode }: AuthFormCardProps) {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      if (mode === 'register' && values.password !== values.confirmPassword) {
        form.setError('confirmPassword', {
          message: 'Passwords do not match',
        });
        return;
      }

      if (mode === 'login') {
        await login(values.email, values.password);
      } else {
        await register(values.email, values.password);
      }
      navigate(appRoutes.dashboard, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    }
  });

  return (
    <section className="auth-card">
      <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
      <p>{mode === 'login' ? 'Sign in to manage your budgets.' : 'Start building your budget workflow.'}</p>

      <form onSubmit={onSubmit} className="form-grid">
        <Input
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />

        <Input
          id="password"
          type="password"
          label="Password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />

        {mode === 'register' && (
          <Input
            id="confirm-password"
            type="password"
            label="Confirm Password"
            autoComplete="new-password"
            error={form.formState.errors.confirmPassword?.message}
            {...form.register('confirmPassword')}
          />
        )}

        {error && <p className="field-error">{error}</p>}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      <p className="subtle">
        {mode === 'login' ? (
          <>
            Need an account? <Link to={appRoutes.register}>Create one</Link>
          </>
        ) : (
          <>
            Already have an account? <Link to={appRoutes.login}>Sign in</Link>
          </>
        )}
      </p>
    </section>
  );
}

export function LoginPage() {
  return (
    <main className="auth-layout">
      <AuthFormCard mode="login" />
    </main>
  );
}

export function RegisterPage() {
  return (
    <main className="auth-layout">
      <AuthFormCard mode="register" />
    </main>
  );
}
