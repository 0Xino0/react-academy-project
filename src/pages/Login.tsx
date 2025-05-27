// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';
import { User as AppUser } from '../types/auth'; // Internal User interface
import axios, { AxiosError } from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent form default submission
    setLoading(true);

    try {
      const apiResponse = await login(formData); // Receives AuthApiResponse
      // console.log('Login API Raw Response:', apiResponse);

      localStorage.setItem('token', apiResponse.access_token);

      // Extract the role from the user.roles array
      let userRole: AppUser['role'] | undefined = undefined;
      if (apiResponse.user && apiResponse.user.roles && apiResponse.user.roles.length > 0) {
        // Assuming the first role in the array is the primary role
        userRole = apiResponse.user.roles[0].name as AppUser['role'];
      }

      if (!userRole) {
        toast.error('User role could not be determined from API response.');
        setLoading(false);
        return;
      }

      const appUser: AppUser = {
        id: String(apiResponse.user.id),
        email: apiResponse.user.email,
        firstName: apiResponse.user.first_name,
        lastName: apiResponse.user.last_name,
        role: userRole,
      };
      
      localStorage.setItem('user', JSON.stringify(appUser));
      // console.log('Stored AppUser:', appUser);

      if (appUser.role === 'manager') {
        navigate('/admin-dashboard'); // Or your manager dashboard route
      } else {
        navigate('/main-panel');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Network error
        if (axiosError.code === 'ERR_NETWORK') {
          toast.error('Network Error: Please check your internet connection.');
          return;
        }

        // Validation error
        if (axiosError.response?.status === 422) {
          const validationErrors = axiosError.response.data as { errors: Record<string, string[]> };
          if (validationErrors) {
            Object.entries(validationErrors.errors).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                messages.forEach(message => {
                  toast.error(`${field}: ${message}`);
                });
              }
            });
          } else {
            toast.error((axiosError.response.data as { message?: string })?.message || 'Validation error');
          }
          return;
        }

        // Authentication error
        if (axiosError.response?.status === 401) {
          toast.error('Invalid email or password');
          return;
        }

        // Server error
        if (axiosError.response && axiosError.response.status >= 500) {
          toast.error('Server error. Please try again later.');
          return;
        }

        // Other errors
        const errorMessage = (axiosError.response?.data as { message?: string })?.message || 'Login failed';
        toast.error(errorMessage);
      } else {
        toast.error('Unexpected error. Please try again.');
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... JSX for the form (no changes needed here)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2 -ml-1" />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}