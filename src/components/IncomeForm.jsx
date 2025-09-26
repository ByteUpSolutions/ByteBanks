import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.js';
import '@/components/ExpenseForm.css'; // Reutilizando os mesmos estilos para consistência

const IncomeForm = ({ user }) => {
    const [valor, setValor] = useState('');
    const [descricao, setDescricao] = useState('');
    const [categoria, setCategoria] = useState('');
    const [banco, setBanco] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const categoriasGanhos = [
        { id: 'salario', nome: 'Salário', icone: '💰' },
        { id: 'vendas', nome: 'Vendas', icone: '📈' },
        { id: 'outros', nome: 'Outros', icone: '🎁' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!valor || !categoria || !banco) {
            setError('Por favor, preencha todos os campos.');
            return;
        }
        setError('');
        setLoading(true);
        setMessage('');

        try {
            const valorNumerico = parseFloat(valor.replace(',', '.'));
            const agora = new Date();

            await addDoc(collection(db, 'usuarios', user.uid, 'lancamentos'), {
                tipo: 'receita',
                valor: valorNumerico,
                descricao: descricao || '',
                categoria: categoria,
                banco: banco,
                formaPagamento: 'N/A', // Não se aplica para ganhos neste fluxo
                data: agora,
                mesAno: `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`,
                isParcelado: false
            });

            setMessage(`Ganho de ${formatarMoeda(valorNumerico)} anotado com sucesso.`);
            setValor('');
            setDescricao('');
            setCategoria('');
            setBanco('');
        } catch (error) {
            console.error('Erro ao salvar ganho:', error);
            setError('Algo deu errado ao salvar o ganho. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };
    
    const formatarMoeda = (valor) => {
        if (typeof valor !== 'number') return 'R$ 0,00';
        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
    }

    return (
        <div className="expense-form-container">
            <h2 className="title-medium">Onde seu dinheiro entrou?</h2>
            <form onSubmit={handleSubmit}>
                <div className="field-group">
                    <label className="field-label">Qual banco recebeu o valor?</label>
                    <div className="bank-grid-top">
                        <button type="button" onClick={() => setBanco('Santander')} className={`btn-secondary bank-button ${banco === 'Santander' ? 'selected' : ''}`}>Santander</button>
                        <button type="button" onClick={() => setBanco('Itaú')} className={`btn-secondary bank-button ${banco === 'Itaú' ? 'selected' : ''}`}>Itaú</button>
                        <button type="button" onClick={() => setBanco('Outros')} className={`btn-secondary bank-button ${banco === 'Outros' ? 'selected' : ''}`}>Outros</button>
                    </div>
                </div>

                <div className="field-group">
                    <label className="field-label">Qual o valor do ganho?</label>
                    <input
                        type="text"
                        value={valor}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9,]/g, '');
                            setValor(val);
                        }}
                        className="input-field"
                        placeholder="Ex: 1500,00"
                    />
                </div>

                <div className="field-group">
                    <label className="field-label">Descrição (Opcional)</label>
                    <input
                        type="text"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        className="input-field"
                        placeholder="Ex: Reforma INSS"
                    />
                </div>

                <div className="field-group">
                    <label className="field-label">Escolha a categoria do ganho:</label>
                    <div className="category-grid">
                        {categoriasGanhos.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategoria(cat.id)}
                                className={`category-button ${categoria === cat.id ? 'selected' : ''}`}
                            >
                                <span className="category-icon">{cat.icone}</span>
                                <span className="category-text">{cat.nome}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button type="submit" className="btn-primary submit-button" disabled={loading}>
                    {loading ? 'Anotando...' : 'Anotar Ganho'}
                </button>
            </form>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
        </div>
    );
};

export default IncomeForm;

