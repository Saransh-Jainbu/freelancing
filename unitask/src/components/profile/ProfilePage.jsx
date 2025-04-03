import { useParams } from 'react-router-dom';
import UserProfile from './UserProfile';

// This is a wrapper component that simply delegates to UserProfile
// It's useful if you want to add route-specific logic in the future
const ProfilePage = () => {
  const { userId } = useParams();
  return <UserProfile userId={userId} />;
};

export default ProfilePage;
