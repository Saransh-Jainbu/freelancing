import PropTypes from 'prop-types';
import { AlertCircle, Plus } from 'lucide-react';

const EmptyState = ({ filterApplied, onCreateClick }) => {
  return (
    <div className="text-center py-12">
      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">No gigs found</h3>
      <p className="text-gray-400 mb-6">
        {filterApplied 
          ? "Try changing your filters or create a new gig"
          : "Start by creating your first gig"}
      </p>
      <button 
        className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity inline-flex items-center gap-2"
        onClick={onCreateClick}
      >
        <Plus className="w-5 h-5" />
        Create New Gig
      </button>
    </div>
  );
};

EmptyState.propTypes = {
  filterApplied: PropTypes.bool.isRequired,
  onCreateClick: PropTypes.func.isRequired
};

export default EmptyState;
