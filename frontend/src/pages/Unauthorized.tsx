import { Link } from 'react-router-dom';

export const Unauthorized = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100 flex-col">
      <h1 className="text-4xl font-bold mb-4 text-red-600">403 Unauthorized</h1>
      <p className="mb-4">You do not have permission to access this page.</p>
      <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
    </div>
  );
};
