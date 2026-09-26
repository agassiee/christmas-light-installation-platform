
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobs, transitionJobStatus, updateAssignment, createNote } from '../api/services';
import { apiClient, setAccessToken } from '../api/client';
import { JobPhotosWorker } from '../components/JobPhotosWorker';

export const WorkerDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ['worker-jobs'], queryFn: getJobs });

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed', e);
    }
    setAccessToken(null);
    navigate('/login');
  };

  const assignmentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => updateAssignment(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['worker-jobs'] })
  });

  const transitionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => transitionJobStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['worker-jobs'] })
  });

  const noteMutation = useMutation({
    mutationFn: ({ jobId, body }: { jobId: string, body: string }) => createNote(jobId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-jobs'] });
      alert('Note added');
    }
  });

  if (isLoading) return <div>Loading your assigned jobs...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Worker Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <h2 className="text-xl font-semibold">Your Assigned Jobs</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job: any) => {
            const myAssignment = job.Assignments?.[0]; // backend filter should return just mine or at least I am in it.
            return (
              <div key={job.id} className="bg-white p-6 rounded shadow border-t-4 border-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{job.type}</h3>
                    <p className="text-sm text-gray-500">{new Date(job.scheduledDate).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2 py-1 bg-gray-200 text-xs font-semibold rounded">{job.status}</span>
                </div>

                <div className="mb-4 text-sm">
                  <p><strong>Property:</strong> {job.property?.addressLine1}, {job.property?.city}</p>
                  <p><strong>Instructions:</strong> {job.instructions || 'None'}</p>
                  <p><strong>Equipment:</strong> {job.equipmentNotes || 'None'}</p>
                </div>

                {myAssignment && myAssignment.status === 'PENDING' && (
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => assignmentMutation.mutate({ id: myAssignment.id, status: 'ACCEPTED' })} className="flex-1 bg-green-600 text-white py-2 rounded text-sm">Accept</button>
                    <button onClick={() => assignmentMutation.mutate({ id: myAssignment.id, status: 'DECLINED' })} className="flex-1 bg-red-600 text-white py-2 rounded text-sm">Decline</button>
                  </div>
                )}

                {myAssignment && myAssignment.status === 'ACCEPTED' && job.status === 'SCHEDULED' && (
                  <button onClick={() => transitionMutation.mutate({ id: job.id, status: 'IN_PROGRESS' })} className="w-full bg-blue-600 text-white py-2 rounded text-sm mb-4">
                    Start Job
                  </button>
                )}

                {myAssignment && myAssignment.status === 'ACCEPTED' && job.status === 'IN_PROGRESS' && (
                  <button onClick={() => transitionMutation.mutate({ id: job.id, status: 'COMPLETED' })} className="w-full bg-green-600 text-white py-2 rounded text-sm mb-4">
                    Complete Job
                  </button>
                )}

                <div className="mt-4 pt-4 border-t">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.target as any).elements.note;
                    if (input.value) {
                      noteMutation.mutate({ jobId: job.id, body: input.value });
                      input.value = '';
                    }
                  }} className="flex gap-2">
                    <input name="note" type="text" placeholder="Add a note..." className="flex-1 border rounded px-2 py-1 text-sm" />
                    <button type="submit" disabled={noteMutation.isPending} className="bg-gray-800 text-white px-3 py-1 rounded text-sm">Add</button>
                  </form>
                </div>

                {/* Photos */}
                <JobPhotosWorker jobId={job.id} />
              </div>
            );
          })}
          {jobs.length === 0 && (
            <div className="col-span-full text-center text-gray-500 bg-white p-8 rounded shadow">
              You have no assigned jobs.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
