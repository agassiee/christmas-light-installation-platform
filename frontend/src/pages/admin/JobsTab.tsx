import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobs, createJob, getProperties, getWorkers, createAssignment, transitionJobStatus } from '../../api/services';
import { JobPhotosAdmin } from '../../components/JobPhotosAdmin';

export const JobsTab = () => {
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading: loadingJobs } = useQuery({ queryKey: ['jobs'], queryFn: getJobs });
  const { data: properties = [] } = useQuery({ queryKey: ['properties'], queryFn: getProperties });
  const { data: workers = [] } = useQuery({ queryKey: ['workers'], queryFn: getWorkers });

  const [showCreate, setShowCreate] = useState(false);
  const [propertyId, setPropertyId] = useState('');
  const [type, setType] = useState('INSTALLATION');
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedPhotosJobId, setSelectedPhotosJobId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowCreate(false);
      setPropertyId('');
      setScheduledDate('');
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ propertyId, type: type as any, scheduledDate: new Date(scheduledDate).toISOString() });
  };

  const assignMutation = useMutation({
    mutationFn: ({ jobId, workerId, isLead }: { jobId: string, workerId: string, isLead: boolean }) => createAssignment(jobId, { workerId, isLead }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] })
  });

  const transitionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => transitionJobStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] })
  });

  if (loadingJobs) return <div>Loading jobs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold">Jobs</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 text-white px-4 py-2 rounded">
          {showCreate ? 'Cancel' : 'Create Job'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded shadow">
          <form onSubmit={handleCreate} className="grid grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium">Property</label>
              <select required value={propertyId} onChange={e => setPropertyId(e.target.value)} className="mt-1 block w-full border rounded p-2">
                <option value="">Select a property</option>
                {properties.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.addressLine1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select required value={type} onChange={e => setType(e.target.value)} className="mt-1 block w-full border rounded p-2">
                <option value="INSTALLATION">INSTALLATION</option>
                <option value="REMOVAL">REMOVAL</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input type="date" required value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="mt-1 block w-full border rounded p-2" />
            </div>
            <button type="submit" disabled={createMutation.isPending} className="bg-green-600 text-white px-4 py-2 rounded">
              Save Job
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type / Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignments</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job: any) => (
              <tr key={job.id}>
                <td className="px-6 py-4 whitespace-nowrap">{job.property?.addressLine1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>{job.type}</div>
                  <span className="text-xs font-bold text-gray-500">{job.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(job.scheduledDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  {job.Assignments?.map((a: any) => (
                    <div key={a.id} className="text-sm">
                      {a.worker.fullName} ({a.isLead ? 'Lead' : 'Asst'}) - {a.status}
                    </div>
                  ))}
                  {job.status === 'SCHEDULED' && (
                    <select
                      className="mt-2 block w-full border text-sm rounded p-1"
                      onChange={(e) => {
                        if (e.target.value) {
                          assignMutation.mutate({ jobId: job.id, workerId: e.target.value, isLead: job.Assignments?.length === 0 });
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">+ Assign Worker</option>
                      {workers.map((w: any) => (
                        <option key={w.id} value={w.id}>{w.fullName}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {job.status === 'SCHEDULED' && (
                    <button onClick={() => transitionMutation.mutate({ id: job.id, status: 'CANCELLED' })} className="text-red-600 hover:text-red-900">Cancel</button>
                  )}
                  {job.status === 'IN_PROGRESS' && (
                    <button onClick={() => transitionMutation.mutate({ id: job.id, status: 'COMPLETED' })} className="text-green-600 hover:text-green-900">Complete</button>
                  )}
                  <button onClick={() => setSelectedPhotosJobId(job.id)} className="text-blue-600 hover:text-blue-900">Photos</button>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No jobs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {selectedPhotosJobId && (
        <JobPhotosAdmin jobId={selectedPhotosJobId} onClose={() => setSelectedPhotosJobId(null)} />
      )}
    </div>
  );
};
