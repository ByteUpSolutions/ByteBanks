import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import './AuthForm.css';

const AuthForm = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let userCredential;
      
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        setMessage('Que bom te ver de novo!');
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Criar documento do usuário no Firestore
        await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
          nome: name || 'Usuário',
          email: email,
          dataCriacao: new Date(),
          bancosCadastrados: ['Banco do Brasil', 'Caixa Econômica', 'Itaú', 'Bradesco'],
          categoriasPadrao: ['Alimentação', 'Saúde', 'Casa', 'Lazer', 'Transporte', 'Outros']
        });
        
        setMessage('Bem-vindo(a) ao Minhas Contas em Dia! Sua conta foi criada com sucesso.');
      }
      
      setTimeout(() => {
        onAuthSuccess(userCredential.user);
      }, 2000);
      
    } catch (error) {
      console.error('Erro na autenticação:', error);
      setMessage('E-mail ou senha incorretos. Verifique e tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="container">
        <div className="auth-container">
          <h1 className="title-large">Minhas Contas em Dia</h1>
          <p className="text-large auth-subtitle">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="field-group">
                <label className="field-label">Seu nome:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Como você gostaria de ser chamado?"
                />
              </div>
            )}

            <div className="field-group">
              <label className="field-label">Seu e-mail:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Digite seu e-mail"
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">Sua senha:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Digite sua senha"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary auth-button"
              disabled={loading}
            >
              {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>

          {message && (
            <div className={message.includes('incorretos') ? 'error-message' : 'success-message'}>
              {message}
            </div>
          )}

          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="btn-secondary toggle-button"
          >
            {isLogin ? 'Não tem conta? Criar uma nova' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;

