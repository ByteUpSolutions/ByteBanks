import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import './Navigation.css';

const Navigation = ({ currentView, setCurrentView, userName }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Meu Resumo', icon: '📊' },
    { id: 'expense', label: 'Lançar Gasto', icon: '💸' },
    { id: 'income', label: 'Adicionar Ganho', icon: '💰' } // Novo botão
  ];

  return (
    <div className="navigation-container">
      <div className="nav-header">
        <h1 className="nav-title">ByteBanks</h1>
        {userName && (
          <p className="nav-greeting">Olá, {userName}!</p>
        )}
      </div>

      <nav className="nav-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`nav-button ${currentView === item.id ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <button onClick={handleLogout} className="logout-button">
        <span className="nav-icon">🚪</span>
        <span className="nav-label">Sair</span>
      </button>
    </div>
  );
};

export default Navigation;

