import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './ExtratoDetalhado.css';

const ExtratoDetalhado = ({ user, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [resultados, setResultados] = useState([]);
    const [filtros, setFiltros] = useState({
        categorias: [],
        mes: '',
        ano: new Date().getFullYear().toString(),
        banco: '',
        formaPagamento: ''
    });

    const [userBanks, setUserBanks] = useState([]);
    const [userCategories, setUserCategories] = useState({});

    const categoriasInfo = {
        'alimentacao': { nome: 'Alimentação' }, 'saude': { nome: 'Saúde' }, 'casa': { nome: 'Casa' },
        'lazer': { nome: 'Lazer' }, 'transporte': { nome: 'Transporte' }, 'outros': { nome: 'Outros' },
        'salario': { nome: 'Salário' }, 'vendas': { nome: 'Vendas' }, 'outros-ganhos': { nome: 'Outros Ganhos' }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            const userDocRef = doc(db, 'usuarios', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserBanks(data.bancosCadastrados || []);
                setUserCategories(categoriasInfo);
            }
        };
        fetchUserData();
    }, [user]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoriaChange = (categoriaId) => {
        setFiltros(prev => {
            const novasCategorias = prev.categorias.includes(categoriaId)
                ? prev.categorias.filter(cat => cat !== categoriaId)
                : [...prev.categorias, categoriaId];
            return { ...prev, categorias: novasCategorias };
        });
    };

    const aplicarFiltros = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let q = collection(db, 'usuarios', user.uid, 'lancamentos');
            let queries = [];

            if (filtros.mes && filtros.ano) {
                const mes = parseInt(filtros.mes, 10);
                const ano = parseInt(filtros.ano, 10);
                const dataInicio = new Date(ano, mes - 1, 1);
                const dataFim = new Date(ano, mes, 0, 23, 59, 59);
                queries.push(where('data', '>=', dataInicio));
                queries.push(where('data', '<=', dataFim));
            } else if (filtros.ano) {
                const ano = parseInt(filtros.ano, 10);
                const dataInicio = new Date(ano, 0, 1);
                const dataFim = new Date(ano, 11, 31, 23, 59, 59);
                queries.push(where('data', '>=', dataInicio));
                queries.push(where('data', '<=', dataFim));
            }

            if (filtros.categorias.length > 0) {
                queries.push(where('categoria', 'in', filtros.categorias));
            }
            if (filtros.banco) {
                queries.push(where('banco', '==', filtros.banco));
            }
            if (filtros.formaPagamento) {
                queries.push(where('formaPagamento', '==', filtros.formaPagamento));
            }

            const finalQuery = query(q, ...queries, orderBy('data', 'desc'));
            const snapshot = await getDocs(finalQuery);
            setResultados(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        } catch (error) {
            console.error("Erro ao aplicar filtros:", error);
            alert("Erro ao buscar dados. O Firebase pode requerer um índice para esta consulta. Verifique o console do navegador para mais detalhes.");
        } finally {
            setLoading(false);
        }
    };
    
    const exportarPDF = () => {
        const doc = new jsPDF();
        doc.text("Extrato Detalhado - ByteBanks", 14, 16);
        doc.setFontSize(10);
        doc.text(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);

        doc.autoTable({
            startY: 30,
            head: [['Data', 'Descrição', 'Categoria', 'Valor']],
            body: resultados.map(r => [
                r.data.toDate().toLocaleDateString('pt-BR'),
                r.descricao || categoriasInfo[r.categoria]?.nome || r.categoria,
                categoriasInfo[r.categoria]?.nome || r.categoria,
                `${r.tipo === 'despesa' ? '-' : '+'} R$ ${r.valor.toFixed(2)}`
            ]),
        });

        doc.save('extrato-bytebanks.pdf');
    };

    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-extrato">
                <button onClick={onClose} className="close-button">&times;</button>
                <h2 className="title-large">Ver Detalhes do Extrato</h2>
                
                <div className="filtros-extrato-container">
                    <div className="filtro-grupo">
                        <label className="field-label">Categorias</label>
                        <div className="category-filter-grid">
                            {Object.entries(userCategories).map(([id, { nome }]) => (
                                <button key={id} onClick={() => handleCategoriaChange(id)}
                                    className={`category-filter-button ${filtros.categorias.includes(id) ? 'selected' : ''}`}>
                                    {nome}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="filtros-dropdown-grid">
                        <div className="filtro-grupo">
                            <label className="field-label">Mês</label>
                            <select name="mes" value={filtros.mes} onChange={handleFilterChange} className="input-field">
                                <option value="">Todos</option>
                                {meses.map((mes, i) => <option key={mes} value={i + 1}>{mes}</option>)}
                            </select>
                        </div>
                        <div className="filtro-grupo">
                            <label className="field-label">Ano</label>
                            <select name="ano" value={filtros.ano} onChange={handleFilterChange} className="input-field">
                                {anos.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                            </select>
                        </div>
                        <div className="filtro-grupo">
                            <label className="field-label">Banco</label>
                             <select name="banco" value={filtros.banco} onChange={handleFilterChange} className="input-field">
                                <option value="">Todos</option>
                                {userBanks.map(banco => <option key={banco} value={banco}>{banco}</option>)}
                            </select>
                        </div>
                        <div className="filtro-grupo">
                           <label className="field-label">Forma de Pagamento</label>
                             <select name="formaPagamento" value={filtros.formaPagamento} onChange={handleFilterChange} className="input-field">
                                <option value="">Todas</option>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="debito">Cartão de Débito</option>
                                <option value="credito">Cartão de Crédito</option>
                                <option value="pix">Pix</option>
                            </select>
                        </div>
                    </div>
                </div>
                <button onClick={aplicarFiltros} disabled={loading} className="btn-primary btn-aplicar-filtros">
                    {loading ? 'Buscando...' : 'Aplicar Filtros'}
                </button>

                <div className="tabela-resultados-container">
                    {resultados.length > 0 && 
                        <button onClick={exportarPDF} className="btn-secondary btn-exportar">
                            Exportar para PDF
                        </button>
                    }
                    <table>
                       <thead>
                           <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr>
                       </thead>
                       <tbody>
                           {resultados.length > 0 ? resultados.map(item => (
                               <tr key={item.id}>
                                   <td>{item.data.toDate().toLocaleDateString('pt-BR')}</td>
                                   <td>{item.descricao || categoriasInfo[item.categoria]?.nome || item.categoria}</td>
                                   <td>{categoriasInfo[item.categoria]?.nome || item.categoria}</td>
                                   <td className={item.tipo === 'despesa' ? 'expense-text' : 'income-text'}>
                                       {item.tipo === 'despesa' ? '-' : '+'} R$ {item.valor.toFixed(2)}
                                   </td>
                               </tr>
                           )) : (
                               <tr><td colSpan="4">Nenhum resultado encontrado para os filtros selecionados.</td></tr>
                           )}
                       </tbody>
                    </table>
                </div>
                 <button onClick={onClose} className="btn-secondary btn-fechar">Fechar</button>
            </div>
        </div>
    );
};

export default ExtratoDetalhado;

