import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProperties, createProperty, getCustomers } from '../../api/services';

export const PropertiesTab = () => {
  const queryClient = useQueryClient();
  const { data: properties = [], isLoading } = useQuery({ queryKey: ['properties'], queryFn: getProperties });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: getCustomers });

  const [customerId, setCustomerId] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const createMutation = useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setAddressLine1('');
      setCity('');
      setState('');
      setPostalCode('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ customerId, addressLine1, city, state, postalCode, country: 'USA' });
  };

  if (isLoading) return <div>Loading properties...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Add Property</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium">Customer</label>
            <select required value={customerId} onChange={e => setCustomerId(e.target.value)} className="mt-1 block w-full border rounded p-2">
              <option value="">Select a customer</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Address Line 1</label>
            <input required value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">City</label>
            <input required value={city} onChange={e => setCity(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">State</label>
            <input required value={state} onChange={e => setState(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Postal Code</label>
            <input required value={postalCode} onChange={e => setPostalCode(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded justify-self-start">
            Add Property
          </button>
        </form>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {properties.map((p: any) => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap">{p.customer?.fullName || p.customerId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{p.addressLine1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{p.city}, {p.state} {p.postalCode}</td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No properties found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
