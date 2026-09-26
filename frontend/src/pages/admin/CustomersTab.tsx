import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, createCustomer } from '../../api/services';

export const CustomersTab = () => {
  const queryClient = useQueryClient();
  const { data: customers = [], isLoading } = useQuery({ queryKey: ['customers'], queryFn: getCustomers });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setFullName('');
      setPhone('');
      setEmail('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ fullName, phone, email, whatsappOptIn: false });
  };

  if (isLoading) return <div>Loading customers...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Add Customer</h2>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input required value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input required value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded">
            Add
          </button>
        </form>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((c: any) => (
              <tr key={c.id}>
                <td className="px-6 py-4 whitespace-nowrap">{c.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{c.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{c.email || '-'}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No customers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
