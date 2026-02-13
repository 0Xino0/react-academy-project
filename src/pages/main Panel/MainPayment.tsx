import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';
import Navbar from '../../components/Navbar';
import UserSidebar from '../../components/UserSidebar';
import { getDebtsOfStudent } from '../../services/api';
import { ApiDebt } from '../../types/Debts';

export default function Payment() {
  const [debts, setDebts] = useState<ApiDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getDebtsOfStudent();
        
        if (response.status) {
          setDebts(response.data || []);
          setTotalRemaining(response.remaining_debt || 0);
          setTotalPaid(response.paid_debt || 0);
        } else {
          throw new Error(response.message || 'Failed to fetch debts');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching debts');
        console.error('Error fetching debts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDebts();
  }, []);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <UserSidebar />
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Student Payment Details</h1>
              <p className="mt-2 text-gray-600">
                Manage payments for student: {user?.first_name} {user?.last_name}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tuition Fee
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {debts.map((debt) => (
                        <tr key={debt.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {debt.registration.class.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(debt.registration.class.start_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(debt.registration.class.end_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${debt.total_amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900"
                              disabled={debt.paid_amount === debt.total_amount}
                            >
                              Pay
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Remaining Debt</span>
                    <span className="font-medium">${totalRemaining}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Paid Amount</span>
                    <span className="font-medium">${totalPaid}</span>
                  </div>
                  <div className="flex justify-end mt-6">
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      disabled={totalRemaining === 0}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Payment
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}