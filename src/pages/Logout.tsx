import {useEffect} from 'react';
import {signOut} from 'firebase/auth';
import { auth } from '../lib/firebase/firebase';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

function Logout() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut(auth);
        setUser(null);
        navigate('/login');
      } catch (error) {
        console.error('Error logging out:', error);
      }
    };

    performLogout();
  }, [setUser, navigate]);

  return null;
}

export default Logout