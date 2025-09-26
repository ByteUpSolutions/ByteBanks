import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AuthForm from './components/AuthForm.jsx';
import Navigation from './components/Navigation.jsx';
import ExpenseForm from './components/ExpenseForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import IncomeForm from './components/IncomeForm.jsx';
import Settings from './components/Settings.jsx';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.nome || 'Usuário');
          }
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
        }
      } else {
        setUser(null);
        setUserName('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (user) => {
    setUser(user);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p className="text-large">A carregar...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app-container">
      <Navigation 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        userName={userName}
      />
      
      <div className="container">
        {currentView === 'dashboard' && <Dashboard user={user} />}
        {currentView === 'expense' && <ExpenseForm user={user} />}
        {currentView === 'income' && <IncomeForm user={user} />} 
        {currentView === 'settings' && <Settings user={user} />}
      </div>
    </div>
  );
}

export default App;

