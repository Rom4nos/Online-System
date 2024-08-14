// src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import GestaoFuncionarios from './pages/GestaoFuncionarios';
import Produtos from './pages/Produtos'; // Import the Produtos component here
import Vendas from './pages/Vendas';
import VendasRealizadas from './pages/VendasRealizadas';
import PedidosPage from './pages/PedidosPage';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/gestao-funcionarios"
            element={
              <PrivateRoute>
                <GestaoFuncionarios />
              </PrivateRoute>
            }
          />
          <Route
            path="/produtos"
            element={
              <PrivateRoute>
                <Produtos />
              </PrivateRoute>
            }
          />
          <Route
            path="/vendas"
            element={
              <AuthProvider>
                <Vendas />
              </AuthProvider>
            }
          />
           <Route
            path="/vendas-realizadas"
            element={
              <AuthProvider>
                <VendasRealizadas />
              </AuthProvider>
            }
          />
          <Route
            path="/pedidos"
            element={
              <AuthProvider>
                <PedidosPage />
              </AuthProvider>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
