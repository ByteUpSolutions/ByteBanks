import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase.js';
import '@/components/Settings.css';

const Settings = ({ user }) => {
  const [bancos, setBancos] = useState([]);
  const [novoBanco, setNovoBanco] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBancos = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setBancos(userDoc.data().bancosCadastrados || []);
        }
      } catch (error) {
        console.error("Erro ao carregar bancos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadBancos();
  }, [user]);

  const handleAddBanco = async (e) => {
    e.preventDefault();
    if (novoBanco.trim() === '' || bancos.includes(novoBanco.trim())) {
      return;
    }
    const userDocRef = doc(db, 'usuarios', user.uid);
    await updateDoc(userDocRef, {
      bancosCadastrados: arrayUnion(novoBanco.trim())
    });
    setBancos([...bancos, novoBanco.trim()]);
    setNovoBanco('');
  };

  const handleRemoveBanco = async (bancoToRemove) => {
    if (window.confirm(`Tem a certeza que quer remover o banco "${bancoToRemove}"?`)) {
      const userDocRef = doc(db, 'usuarios', user.uid);
      await updateDoc(userDocRef, {
        bancosCadastrados: arrayRemove(bancoToRemove)
      });
      setBancos(bancos.filter(b => b !== bancoToRemove));
    }
  };

  if (loading) {
    return <p className="text-large">A carregar configurações...</p>;
  }

  return (
    <div className="settings-container">
      <h2 className="title-medium">Configurações</h2>
      
      <div className="dashboard-card">
        <h3 className="title-medium">Gerir os Seus Bancos</h3>
        
        <form onSubmit={handleAddBanco} className="add-bank-form">
          <input
            type="text"
            value={novoBanco}
            onChange={(e) => setNovoBanco(e.target.value)}
            className="input-field"
            placeholder="Nome do novo banco"
          />
          <button type="submit" className="btn-primary">Adicionar Banco</button>
        </form>

        <div className="bank-list">
          {bancos.length > 0 ? (
            bancos.map(banco => (
              <div key={banco} className="bank-item">
                <span>{banco}</span>
                <button onClick={() => handleRemoveBanco(banco)} className="remove-bank-button">
                  Remover
                </button>
              </div>
            ))
          ) : (
            <p>Ainda não tem bancos adicionados.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

