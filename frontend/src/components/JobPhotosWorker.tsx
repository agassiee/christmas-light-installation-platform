import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobPhotos, getUploadSignature, uploadToCloudinary, createJobPhoto, deleteJobPhoto } from '../api/services';
import type { PhotoType } from '../api/types';

export const JobPhotosWorker = ({ jobId }: { jobId: string }) => {
  const queryClient = useQueryClient();
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['job-photos', jobId],
    queryFn: () => getJobPhotos(jobId)
  });

  const [uploading, setUploading] = useState<PhotoType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: PhotoType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10MB');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/heic'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file format. Please use JPEG, PNG, or HEIC.');
      return;
    }

    setError(null);
    setUploading(type);

    try {
      // 1. Get signature
      const signatureData = await getUploadSignature(jobId, type);

      // 2. Direct upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(file, signatureData);

      // 3. Save metadata to backend
      await createJobPhoto(jobId, {
        type,
        storageKey: signatureData.folder + '/' + signatureData.public_id, // Follow our convention
        url: cloudinaryResult.secure_url
      });

      queryClient.invalidateQueries({ queryKey: ['job-photos', jobId] });
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(null);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => deleteJobPhoto(jobId, photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-photos', jobId] }),
  });

  if (isLoading) return <div className="text-sm">Loading photos...</div>;

  const beforePhotos = photos.filter((p: any) => p.type === 'BEFORE');
  const afterPhotos = photos.filter((p: any) => p.type === 'AFTER');

  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="font-bold text-sm mb-2">Job Photos</h4>
      {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
      
      <div className="space-y-4">
        {/* BEFORE Photos */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold bg-gray-200 px-2 py-1 rounded">BEFORE</span>
            <label className="cursor-pointer text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
              {uploading === 'BEFORE' ? 'Uploading...' : 'Upload Before'}
              <input type="file" className="hidden" accept="image/jpeg, image/png, image/heic" onChange={(e) => handleFileChange(e, 'BEFORE')} disabled={uploading !== null} />
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {beforePhotos.map((p: any) => (
              <div key={p.id} className="relative flex-shrink-0">
                <img src={p.url} alt="Before" className="w-20 h-20 object-cover rounded shadow" />
                <button onClick={() => deleteMutation.mutate(p.id)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700 m-1">&times;</button>
              </div>
            ))}
            {beforePhotos.length === 0 && <span className="text-xs text-gray-400">No before photos</span>}
          </div>
        </div>

        {/* AFTER Photos */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold bg-gray-200 px-2 py-1 rounded">AFTER</span>
            <label className="cursor-pointer text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
              {uploading === 'AFTER' ? 'Uploading...' : 'Upload After'}
              <input type="file" className="hidden" accept="image/jpeg, image/png, image/heic" onChange={(e) => handleFileChange(e, 'AFTER')} disabled={uploading !== null} />
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {afterPhotos.map((p: any) => (
              <div key={p.id} className="relative flex-shrink-0">
                <img src={p.url} alt="After" className="w-20 h-20 object-cover rounded shadow" />
                <button onClick={() => deleteMutation.mutate(p.id)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700 m-1">&times;</button>
              </div>
            ))}
            {afterPhotos.length === 0 && <span className="text-xs text-gray-400">No after photos</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
