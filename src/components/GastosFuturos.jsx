import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import './GastosFuturos.css';

const GastosFuturos = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [gastos, setGastos] = useState([]);
    const [gastosFiltrados, setGastosFiltrados] = useState([]);
    const [filtros, setFiltros] = useState({ mes: '', banco: '', categoria: '' });

    const categoriasInfo = {
        'alimentacao': { nome: 'Alimentação', icone: '🍎' }, 'saude': { nome: 'Saúde', icone: '✚' },
        'casa': { nome: 'Casa', icone: '🏠' }, 'lazer': { nome: 'Lazer', icone: '🎬' },
        'transporte': { nome: 'Transporte', icone: '🚗' }, 'outros': { nome: 'Outros', icone: '📦' }
    };

    useEffect(() => {
        const fetchGastosFuturos = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                const q = query(
                    collection(db, 'usuarios', user.uid, 'lancamentos'),
                    where('data', '>=', hoje),
                    where('tipo', '==', 'despesa'),
                    orderBy('data', 'asc')
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setGastos(data);
                setGastosFiltrados(data);
            } catch (error) {
                console.error("Erro ao buscar gastos futuros:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGastosFuturos();
    }, [user]);
    
    useEffect(() => {
        let data = [...gastos];
        if (filtros.mes) {
            data = data.filter(g => g.data.toDate().getMonth() + 1 === parseInt(filtros.mes));
        }
        if (filtros.banco) {
            data = data.filter(g => g.banco === filtros.banco);
        }
        if (filtros.categoria) {
            data = data.filter(g => g.categoria === filtros.categoria);
        }
        setGastosFiltrados(data);
    }, [filtros, gastos]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const formatarMoeda = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;
    const formatarData = (data) => data.toDate().toLocaleDateString('pt-BR');

    return (
        <div className="container">
            <h2 className="title-large">Meus Gastos Futuros</h2>

            <div className="filtros-futuros-container">
                {/* Adicionar filtros aqui se necessário */}
            </div>

            {loading ? <p>Carregando...</p> : (
                <div className="lista-gastos-futuros">
                    {gastosFiltrados.length > 0 ? gastosFiltrados.map(gasto => (
                        <div key={gasto.id} className="gasto-futuro-item">
                            <div className="gasto-info">
                                <span className="gasto-icone">{categoriasInfo[gasto.categoria]?.icone}</span>
                                <div className="gasto-detalhes">
                                    <span className="gasto-descricao">{gasto.descricao || categoriasInfo[gasto.categoria]?.nome}</span>
                                    <span className="gasto-subinfo">{gasto.banco} - {formatarData(gasto.data)}</span>
                                </div>
                            </div>
                            <div className="gasto-valores">
                                <span className="gasto-valor">{formatarMoeda(gasto.valor)}</span>
                                {gasto.isParcelado && <span className="gasto-parcela">{`(${gasto.parcelaAtual}/${gasto.totalParcelas})`}</span>}
                            </div>
                        </div>
                    )) : <p>Nenhum gasto futuro encontrado.</p>}
                </div>
            )}
        </div>
    );
};

export default GastosFuturos;
