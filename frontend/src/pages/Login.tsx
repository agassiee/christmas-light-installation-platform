import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiClient, setAccessToken } from '../api/client';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/auth/login', { email, password });
      return res.data;
    },
    onSuccess: (data) => {
      setAccessToken(data.data.accessToken);
      // Fetch role to redirect
      apiClient.get('/auth/me').then(res => {
        if (res.data.data.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/worker');
        }
      });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error?.message || 'Login failed');
    }
  });

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6">Christmas Lights Login</h1>
        {errorMsg && <div className="mb-4 text-red-500">{errorMsg}</div>}
        <form onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(); }}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              className="w-full border p-2 rounded" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input 
              type="password" 
              className="w-full border p-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loginMutation.isPending}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};
