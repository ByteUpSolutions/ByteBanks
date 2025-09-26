import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import './EditModal.css';

const EditModal = ({ user, lancamento, onClose }) => {
    const [formData, setFormData] = useState({ ...lancamento, valor: lancamento?.valor?.toString() || '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [userBanks, setUserBanks] = useState([]);

    // Definindo categorias diretamente para evitar erros de referência
    const categoriasGasto = {
        'alimentacao': { nome: 'Alimentação', icone: '🍎' }, 'saude': { nome: 'Saúde', icone: '✚' },
        'casa': { nome: 'Casa', icone: '🏠' }, 'lazer': { nome: 'Lazer', icone: '🎬' },
        'transporte': { nome: 'Transporte', icone: '🚗' }, 'outros': { nome: 'Outros', icone: '📦' }
    };
    const categoriasGanho = {
        'salario': { nome: 'Salário', icone: '💰' }, 'vendas': { nome: 'Vendas', icone: '📈' },
        'outros-ganhos': { nome: 'Outros Ganhos', icone: '🎁' }
    };
    const formasPagamento = {
        'dinheiro': { nome: 'Dinheiro' }, 'debito': { nome: 'Cartão de Débito' },
        'credito': { nome: 'Cartão de Crédito' }, 'pix': { nome: 'Pix' }
    };

    useEffect(() => {
        const loadUserBanks = async () => {
            if (user?.uid) {
                const userDocRef = doc(db, 'usuarios', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserBanks(userDoc.data().bancosCadastrados || []);
                }
            }
        };
        loadUserBanks();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleValorChange = (e) => {
        let { value } = e.target;
        value = value.replace(/[^0-9,.]/g, ''); // Permite apenas números, vírgulas e pontos
        value = value.replace('.', ','); // Troca ponto por vírgula para consistência
        if (value.split(',').length > 2) {
             value = value.replace(/,(?=[^,]*$)/, '.'); // Mantém apenas a última vírgula
        }
        setFormData(prev => ({ ...prev, valor: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const valorNumerico = parseFloat(formData.valor.replace(',', '.'));
            if (isNaN(valorNumerico)) {
                setMessage("O valor inserido não é válido.");
                setLoading(false);
                return;
            }

            const docRef = doc(db, 'usuarios', user.uid, 'lancamentos', lancamento.id);
            await updateDoc(docRef, {
                ...formData,
                valor: valorNumerico,
                data: formData.data // Mantém o timestamp original ou um novo se houver campo de data
            });

            setMessage('Lançamento atualizado com sucesso!');
            setTimeout(() => {
                onClose(true); // Passa true para indicar que houve atualização
            }, 1500);

        } catch (error) {
            console.error("Erro ao atualizar lançamento:", error);
            setMessage('Algo deu errado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };
    
    // Garante que o objeto de categorias existe antes de tentar usar Object.entries
    const currentCategories = formData.tipo === 'despesa' ? categoriasGasto : categoriasGanho;

    if (!lancamento) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button onClick={() => onClose(false)} className="close-button">&times;</button>
                <h2 className="title-medium">Editar Lançamento</h2>
                <form onSubmit={handleSubmit}>
                    <div className="field-group">
                        <label className="field-label">Valor:</label>
                        <input type="text" name="valor" value={formData.valor} onChange={handleValorChange} className="input-field" required />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Descrição:</label>
                        <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} className="input-field" />
                    </div>

                    <div className="field-group">
                        <label className="field-label">Categoria:</label>
                        <select name="categoria" value={formData.categoria} onChange={handleChange} className="input-field">
                            {Object.entries(currentCategories).map(([id, { nome }]) => (
                                <option key={id} value={id}>{nome}</option>
                            ))}
                        </select>
                    </div>

                     <div className="field-group">
                        <label className="field-label">Banco:</label>
                        <select name="banco" value={formData.banco} onChange={handleChange} className="input-field">
                            {userBanks.map(banco => <option key={banco} value={banco}>{banco}</option>)}
                            <option value="Outros">Outros</option>
                        </select>
                    </div>

                    <div className="field-group">
                        <label className="field-label">Forma de Pagamento:</label>
                        <select name="formaPagamento" value={formData.formaPagamento} onChange={handleChange} className="input-field">
                            {Object.entries(formasPagamento).map(([id, { nome }]) => (
                                <option key={id} value={id}>{nome}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
                {message && <div className={message.includes('errado') ? 'error-message' : 'success-message'}>{message}</div>}
            </div>
        </div>
    );
};

export default EditModal;

