import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '../Firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Header.css';

const Header = () => {
  const { currentUser } = useAuth();
  const [userPosition, setUserPosition] = useState(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const fetchUserPosition = async () => {
      if (currentUser) {
        try {
          const userDoc = doc(db, 'users', currentUser.uid);
          const docSnapshot = await getDoc(userDoc);
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            setUserPosition(userData.position); // Supondo que o campo de posição seja `position`
          }
        } catch (error) {
          console.error('Error fetching user position:', error);
        }
      }
    };

    fetchUserPosition();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Redireciona para a página de login após o logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-left">
        {currentUser && (
          <>
            <div className="user-circle"></div>
            <span className="user-name">Logged in as: {currentUser.email}</span>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
      <div className="hamburger-menu" onClick={toggleMobileMenu}>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <nav className={`header-center ${isMobileMenuOpen ? 'mobile-menu show' : ''}`}>
        {(userPosition === 'admin' || userPosition === 'superadmin') && (
          <ul>
            <li>
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Dashboard</NavLink>
            </li>
            <li>
              <NavLink to="/vendas-realizadas" className={({ isActive }) => (isActive ? 'active' : '')}>Vendas Realizadas</NavLink>
            </li>
            <li>
              <NavLink to="/gestao-funcionarios" className={({ isActive }) => (isActive ? 'active' : '')}>Gestão</NavLink>
            </li>
            <li>
              <NavLink to="/pedidos" className={({ isActive }) => (isActive ? 'active' : '')}>Pedidos</NavLink>
            </li>
          </ul>
        )}
        <ul>
          <li>
            <NavLink to="/produtos" className={({ isActive }) => (isActive ? 'active' : '')}>Produtos</NavLink>
          </li>
          <li>
            <NavLink to="/vendas" className={({ isActive }) => (isActive ? 'active' : '')}>Vendas</NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
