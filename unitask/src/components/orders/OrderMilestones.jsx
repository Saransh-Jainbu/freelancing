import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const OrderMilestones = ({ orderId, status: orderStatus }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}/milestones`);
        const data = await response.json();
        if (data.success) {
          setMilestones(data.milestones);
        }
      } catch (error) {
        console.error('Error fetching milestones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [orderId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return <div>Loading milestones...</div>;
  }

  return (
    <div className="space-y-4">
      {milestones.map((milestone, index) => (
        <div 
          key={milestone.id}
          className="flex items-start gap-4 p-4 bg-white/5 rounded-lg"
        >
          <div className="flex-shrink-0">
            {getStatusIcon(milestone.status)}
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium">{milestone.title}</h4>
            <p className="text-sm text-gray-400">{milestone.description}</p>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="text-gray-400">
                Due: {format(new Date(milestone.due_date), 'MMM d, yyyy')}
              </span>
              <span className="text-purple-400">
                ${milestone.amount}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderMilestones;
