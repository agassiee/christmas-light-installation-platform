import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkers, createWorker } from '../../api/services';

export const WorkersTab = () => {
  const queryClient = useQueryClient();
  const { data: workers = [], isLoading } = useQuery({ queryKey: ['workers'], queryFn: getWorkers });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const createMutation = useMutation({
    mutationFn: createWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ fullName, email, phone, password });
  };

  if (isLoading) return <div>Loading workers...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Register Worker</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input required value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Email (Login)</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input required value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Temporary Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded justify-self-start">
            Register Worker
          </button>
        </form>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workers.map((w: any) => (
              <tr key={w.id}>
                <td className="px-6 py-4 whitespace-nowrap">{w.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{w.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{w.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${w.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {w.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {workers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No workers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
