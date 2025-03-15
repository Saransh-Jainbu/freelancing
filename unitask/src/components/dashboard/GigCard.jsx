import PropTypes from 'prop-types';
import { Pencil, Trash2, Eye, Link } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

const GigCard = ({ gig, onToggleStatus, onDelete, onEdit }) => {
  return (
    <div 
      className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
      
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <span className={`px-3 py-1 rounded-full text-sm ${
          gig.status === 'active' 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
        </span>
        <div className="flex gap-2">
          <RouterLink 
            to={`/gig/${gig.id}`}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-blue-400"
            title="View Gig"
          >
            <Link className="w-4 h-4" />
          </RouterLink>
          <button 
            onClick={() => onToggleStatus(gig.id)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title={gig.status === 'active' ? 'Pause Gig' : 'Activate Gig'}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onEdit(gig)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Edit Gig"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(gig.id)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-red-400"
            title="Delete Gig"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gig Content */}
      <div className="relative z-10">
        <h3 className="text-lg font-semibold mb-2">{gig.title}</h3>
        <p className="text-gray-400 text-sm mb-4">{gig.description}</p>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-gray-400 text-sm">Price</p>
            <p className="font-semibold">{gig.price}</p>
          </div>
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-gray-400 text-sm">Orders</p>
            <p className="font-semibold">{gig.orders}</p>
          </div>
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-gray-400 text-sm">Rating</p>
            <p className="font-semibold">{gig.rating} ★</p>
          </div>
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-gray-400 text-sm">Earnings</p>
            <p className="font-semibold">{gig.earnings}</p>
          </div>
        </div>

        <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full group-hover:w-full transition-all duration-500" />
      </div>
    </div>
  );
};

GigCard.propTypes = {
  gig: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.string,
    status: PropTypes.string,
    orders: PropTypes.number,
    rating: PropTypes.number,
    earnings: PropTypes.string,
  }).isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

export default GigCard;
