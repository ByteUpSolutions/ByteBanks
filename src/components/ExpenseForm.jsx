import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';
import './ExpenseForm.css';

const ExpenseForm = ({ user }) => {
    const [valor, setValor] = useState('');
    const [descricao, setDescricao] = useState('');
    const [categoria, setCategoria] = useState('');
    const [banco, setBanco] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [userBanks, setUserBanks] = useState([]);
    
    // Novas opções de parcelamento
    const [tipoPagamento, setTipoPagamento] = useState('vista'); // 'vista' ou 'parcelado'
    const [numParcelas, setNumParcelas] = useState(2);
    const [comJuros, setComJuros] = useState(false);
    const [taxaJuros, setTaxaJuros] = useState('');
    const [error, setError] = useState('');

    const categorias = [
        { id: 'alimentacao', nome: 'Alimentação', icone: '🍎' },
        { id: 'saude', nome: 'Saúde', icone: '✚' },
        { id: 'casa', nome: 'Casa', icone: '🏠' },
        { id: 'lazer', nome: 'Lazer', icone: '🎬' },
        { id: 'transporte', nome: 'Transporte', icone: '🚗' },
        { id: 'outros', nome: 'Outros', icone: '📦' }
    ];

    const formasPagamento = [
        { id: 'dinheiro', nome: 'Dinheiro' },
        { id: 'debito', nome: 'Cartão de Débito' },
        { id: 'credito', nome: 'Cartão de Crédito' },
        { id: 'pix', nome: 'Pix' }
    ];

    useEffect(() => {
        const loadUserData = async () => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
                if (userDoc.exists()) {
                    setUserBanks(userDoc.data().bancosCadastrados || []);
                }
            }
        };
        loadUserData();
    }, [user]);

    const validarFormulario = () => {
        if (!valor || !categoria || !banco || !formaPagamento) {
            setError('Preencha todos os campos obrigatórios.');
            return false;
        }
        if (parseFloat(valor.replace(',', '.')) <= 0) {
            setError('O valor do gasto deve ser maior que zero.');
            return false;
        }
        if (formaPagamento === 'credito' && tipoPagamento === 'parcelado' && (numParcelas < 2 || numParcelas > 24)) {
            setError('O número de parcelas deve ser entre 2 e 24.');
            return false;
        }
        setError('');
        return true;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        setLoading(true);
        setMessage('');

        try {
            const valorNumerico = parseFloat(valor.replace(',', '.'));
            const agora = new Date();
            const batch = writeBatch(db);
            const idCompraParcelada = `parc-${Date.now()}`;

            if (formaPagamento === 'credito' && tipoPagamento === 'parcelado') {
                let valorTotal = valorNumerico;
                if (comJuros && taxaJuros) {
                    const juros = parseFloat(taxaJuros.replace(',', '.')) / 100;
                    valorTotal = valorNumerico * (1 + juros);
                }
                const valorParcela = valorTotal / numParcelas;

                for (let i = 0; i < numParcelas; i++) {
                    const dataParcela = new Date(agora.getFullYear(), agora.getMonth() + i, agora.getDate());
                    const lancamentoRef = doc(collection(db, 'usuarios', user.uid, 'lancamentos'));
                    
                    batch.set(lancamentoRef, {
                        tipo: 'despesa',
                        valor: valorParcela,
                        descricao: `${descricao || categoria} (${i + 1}/${numParcelas})`,
                        categoria, banco, formaPagamento, data: dataParcela,
                        mesAno: format(dataParcela, 'yyyy-MM'),
                        isParcelado: true,
                        parcelaAtual: i + 1,
                        totalParcelas: numParcelas,
                        idCompraParcelada
                    });
                }
            } else {
                const lancamentoRef = doc(collection(db, 'usuarios', user.uid, 'lancamentos'));
                batch.set(lancamentoRef, {
                    tipo: 'despesa',
                    valor: valorNumerico,
                    descricao, categoria, banco, formaPagamento, data: agora,
                    mesAno: format(agora, 'yyyy-MM'),
                    isParcelado: false
                });
            }

            await batch.commit();

            setMessage(`Gasto com '${descricao || categoria}' anotado com sucesso.`);
            setValor(''); setDescricao(''); setCategoria(''); setBanco('');
            setFormaPagamento(''); setTipoPagamento('vista'); setNumParcelas(2);
            setComJuros(false); setTaxaJuros('');
            
        } catch (error) {
            console.error('Erro ao salvar gasto:', error);
            setError('Algo deu errado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="expense-form-container">
            <h2 className="title-medium">Onde seu dinheiro foi?</h2>
            
            <form onSubmit={handleSubmit} className="expense-form" noValidate>
                <div className="field-group">
                    <label className="field-label">Qual banco você usou?</label>
                    <div className="bank-grid-top">
                        <button type="button" onClick={() => setBanco('Santander')} className={`btn-secondary bank-button ${banco === 'Santander' ? 'selected' : ''}`}>Santander</button>
                        <button type="button" onClick={() => setBanco('Itaú')} className={`btn-secondary bank-button ${banco === 'Itaú' ? 'selected' : ''}`}>Itaú</button>
                        <button type="button" onClick={() => setBanco('Outros')} className={`btn-secondary bank-button ${banco === 'Outros' ? 'selected' : ''}`}>Outros</button>
                    </div>
                </div>

                <div className="field-group">
                    <label className="field-label">Quanto você gastou?</label>
                    <input type="text" value={valor}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9,]/g, '');
                            setValor(val);
                        }}
                        className="input-field" placeholder="Ex: 25,50" />
                </div>

                <div className="field-group">
                    <label className="field-label">Como você pagou?</label>
                    <div className="payment-grid">
                        {formasPagamento.map((forma) => (
                            <button key={forma.id} type="button" onClick={() => setFormaPagamento(forma.id)}
                                className={`btn-secondary payment-button ${formaPagamento === forma.id ? 'selected' : ''}`}>{forma.nome}</button>
                        ))}
                    </div>
                </div>

                {formaPagamento === 'credito' && (
                    <div className="parcelamento-section">
                        <div className="field-group">
                            <label className="field-label">Tipo de Pagamento</label>
                            <div className="toggle-group">
                                <button type="button" onClick={() => setTipoPagamento('vista')} className={tipoPagamento === 'vista' ? 'active' : ''}>À Vista</button>
                                <button type="button" onClick={() => setTipoPagamento('parcelado')} className={tipoPagamento === 'parcelado' ? 'active' : ''}>Parcelado</button>
                            </div>
                        </div>

                        {tipoPagamento === 'parcelado' && (
                            <div className="parcelamento-details">
                                <div className="field-group">
                                    <label className="field-label">Número de Parcelas (2 a 24)</label>
                                    <input type="number" value={numParcelas} min="2" max="24"
                                        onChange={(e) => setNumParcelas(parseInt(e.target.value))}
                                        className="input-field" />
                                </div>
                                <div className="field-group-checkbox">
                                    <input type="checkbox" id="comJuros" checked={comJuros} onChange={(e) => setComJuros(e.target.checked)} />
                                    <label htmlFor="comJuros">Tem juros?</label>
                                </div>
                                {comJuros && (
                                    <div className="field-group">
                                        <label className="field-label">Taxa de Juros (%)</label>
                                        <input type="text" value={taxaJuros}
                                            onChange={(e) => setTaxaJuros(e.target.value.replace(/[^0-9,]/g, ''))}
                                            className="input-field" placeholder="Ex: 1,99" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Outros campos */}
                <div className="field-group">
                    <label className="field-label">O que você comprou? (Opcional)</label>
                    <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)}
                        className="input-field" placeholder="Ex: Pão na padaria" />
                </div>
                <div className="field-group">
                    <label className="field-label">Escolha a categoria:</label>
                    <div className="category-grid">
                        {categorias.map((cat) => (
                            <button key={cat.id} type="button" onClick={() => setCategoria(cat.id)}
                                className={`category-button ${categoria === cat.id ? 'selected' : ''}`}>
                                <span className="category-icon">{cat.icone}</span>
                                <span className="category-text">{cat.nome}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button type="submit" className="btn-primary submit-button" disabled={loading}>{loading ? 'Anotando...' : 'Anotar Gasto'}</button>
            </form>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
        </div>
    );
};

export default ExpenseForm;

