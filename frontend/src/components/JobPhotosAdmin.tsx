import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobPhotos, deleteJobPhoto } from '../api/services';

export const JobPhotosAdmin = ({ jobId, onClose }: { jobId: string, onClose: () => void }) => {
  const queryClient = useQueryClient();
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['job-photos', jobId],
    queryFn: () => getJobPhotos(jobId)
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => deleteJobPhoto(jobId, photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-photos', jobId] }),
  });

  const beforePhotos = photos.filter((p: any) => p.type === 'BEFORE');
  const afterPhotos = photos.filter((p: any) => p.type === 'AFTER');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Job Photos</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times; Close</button>
        </div>

        {isLoading ? (
          <div>Loading photos...</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold border-b pb-1 mb-2">BEFORE</h4>
              <div className="flex gap-2 flex-wrap">
                {beforePhotos.map((p: any) => (
                  <div key={p.id} className="relative">
                    <img src={p.url} alt="Before" className="w-32 h-32 object-cover rounded shadow border" />
                    <button onClick={() => { if(window.confirm('Delete photo?')) deleteMutation.mutate(p.id) }} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-800 shadow">&times;</button>
                  </div>
                ))}
                {beforePhotos.length === 0 && <span className="text-sm text-gray-500">No before photos</span>}
              </div>
            </div>

            <div>
              <h4 className="font-semibold border-b pb-1 mb-2">AFTER</h4>
              <div className="flex gap-2 flex-wrap">
                {afterPhotos.map((p: any) => (
                  <div key={p.id} className="relative">
                    <img src={p.url} alt="After" className="w-32 h-32 object-cover rounded shadow border" />
                    <button onClick={() => { if(window.confirm('Delete photo?')) deleteMutation.mutate(p.id) }} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-800 shadow">&times;</button>
                  </div>
                ))}
                {afterPhotos.length === 0 && <span className="text-sm text-gray-500">No after photos</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
