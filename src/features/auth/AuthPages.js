import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '@shared/auth/authApi';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
const authSchema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().optional(),
});
function AuthFormCard({ mode }) {
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const form = useForm({
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
            }
            else {
                await register(values.email, values.password);
            }
            navigate('/dashboard', { replace: true });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Authentication failed';
            setError(message);
        }
    });
    return (_jsxs("section", { className: "auth-card", children: [_jsx("h1", { children: mode === 'login' ? 'Welcome back' : 'Create account' }), _jsx("p", { children: mode === 'login' ? 'Sign in to manage your budgets.' : 'Start building your budget workflow.' }), _jsxs("form", { onSubmit: onSubmit, className: "form-grid", children: [_jsx(Input, { id: "email", type: "email", label: "Email", autoComplete: "email", error: form.formState.errors.email?.message, ...form.register('email') }), _jsx(Input, { id: "password", type: "password", label: "Password", autoComplete: mode === 'login' ? 'current-password' : 'new-password', error: form.formState.errors.password?.message, ...form.register('password') }), mode === 'register' && (_jsx(Input, { id: "confirm-password", type: "password", label: "Confirm Password", autoComplete: "new-password", error: form.formState.errors.confirmPassword?.message, ...form.register('confirmPassword') })), error && _jsx("p", { className: "field-error", children: error }), _jsx(Button, { type: "submit", disabled: form.formState.isSubmitting, children: form.formState.isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account' })] }), _jsx("p", { className: "subtle", children: mode === 'login' ? (_jsxs(_Fragment, { children: ["Need an account? ", _jsx(Link, { to: "/register", children: "Create one" })] })) : (_jsxs(_Fragment, { children: ["Already have an account? ", _jsx(Link, { to: "/login", children: "Sign in" })] })) })] }));
}
export function LoginPage() {
    return (_jsx("main", { className: "auth-layout", children: _jsx(AuthFormCard, { mode: "login" }) }));
}
export function RegisterPage() {
    return (_jsx("main", { className: "auth-layout", children: _jsx(AuthFormCard, { mode: "register" }) }));
}
