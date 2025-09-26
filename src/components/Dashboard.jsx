  import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import EditModal from './EditModal.jsx';
import ExtratoDetalhado from './ExtratoDetalhado.jsx';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mensal');
  const [dashboardFiltro, setDashboardFiltro] = useState('geral');
  const [isExtratoOpen, setIsExtratoOpen] = useState(false);

  // States for data
  const [totalGanhos, setTotalGanhos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [lancamentos, setLancamentos] = useState([]);
  const [gastosPorCategoria, setGastosPorCategoria] = useState([]);
  const [ganhosPorCategoria, setGanhosPorCategoria] = useState([]);
  const [gastosPorBanco, setGastosPorBanco] = useState([]);
  const [gastosAnuais, setGastosAnuais] = useState({ gastos: Array(12).fill(0), ganhos: Array(12).fill(0) });
  const [gastosFuturos, setGastosFuturos] = useState([]);
  
  // State for editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lancamentoParaEditar, setLancamentoParaEditar] = useState(null);

  const categoriasInfo = {
    'alimentacao': { nome: 'Alimentação', icone: '🍎', cor: '#4285F4' }, 'saude': { nome: 'Saúde', icone: '✚', cor: '#34A853' },
    'casa': { nome: 'Casa', icone: '🏠', cor: '#FBBC04' }, 'lazer': { nome: 'Lazer', icone: '🎬', cor: '#EA4335' },
    'transporte': { nome: 'Transporte', icone: '🚗', cor: '#9C27B0' }, 'outros': { nome: 'Outros', icone: '📦', cor: '#757575' },
    'salario': { nome: 'Salário', icone: '💰', cor: '#2E7D32' }, 'vendas': { nome: 'Vendas', icone: '📈', cor: '#0277BD' },
    'outros-ganhos': { nome: 'Outros Ganhos', icone: '🎁', cor: '#6A1B9A' }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
        const agora = new Date();
        let dataInicio, dataFim;

        if (periodo === 'anual') {
            dataInicio = new Date(agora.getFullYear(), 0, 1);
            dataFim = new Date(agora.getFullYear(), 11, 31, 23, 59, 59);
        } else { // Mensal
            dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0);
            dataFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);
        }
      
        const lancamentosQuery = query(
            collection(db, 'usuarios', user.uid, 'lancamentos'),
            where('data', '>=', dataInicio),
            where('data', '<=', dataFim),
            orderBy('data', 'desc')
        );
        const snapshot = await getDocs(lancamentosQuery);
        const lancamentosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        processarLancamentos(lancamentosData);

        const dataInicioAno = new Date(agora.getFullYear(), 0, 1);
        const dataFimAno = new Date(agora.getFullYear(), 11, 31, 23, 59, 59);
        const qAnual = query(collection(db, 'usuarios', user.uid, 'lancamentos'), where('data', '>=', dataInicioAno), where('data', '<=', dataFimAno));
        const snapAnual = await getDocs(qAnual);
        processarDadosAnuais(snapAnual.docs.map(d => d.data()));
        
        // Fetch future expenses for the new section
        const hoje = new Date();
        const qFuturos = query(
            collection(db, 'usuarios', user.uid, 'lancamentos'),
            where('data', '>=', hoje),
            where('tipo', '==', 'despesa'),
            orderBy('data', 'asc')
        );
        const snapFuturos = await getDocs(qFuturos);
        setGastosFuturos(snapFuturos.docs.map(doc => ({id: doc.id, ...doc.data()})));


    } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, periodo]);

  const processarDadosAnuais = (data) => {
    const anuais = { gastos: Array(12).fill(0), ganhos: Array(12).fill(0) };
    data.forEach(lanc => {
        const mes = lanc.data.toDate().getMonth();
        if (lanc.tipo === 'despesa') anuais.gastos[mes] += lanc.valor;
        else anuais.ganhos[mes] += lanc.valor;
    });
    setGastosAnuais(anuais);
  };

  const processarLancamentos = (data) => {
    let ganhos = 0, gastos = 0;
    const catGastosMap = {}, catGanhosMap = {}, bancoMap = {};

    data.forEach(lanc => {
        if (lanc.tipo === 'receita') {
            ganhos += lanc.valor;
            catGanhosMap[lanc.categoria] = (catGanhosMap[lanc.categoria] || 0) + lanc.valor;
        } else {
            gastos += lanc.valor;
            catGastosMap[lanc.categoria] = (catGastosMap[lanc.categoria] || 0) + lanc.valor;
            bancoMap[lanc.banco] = (bancoMap[lanc.banco] || 0) + lanc.valor;
        }
    });

    setTotalGanhos(ganhos); setTotalGastos(gastos); setLancamentos(data);
    setGastosPorCategoria(Object.entries(catGastosMap).map(([k, v]) => ({ name: categoriasInfo[k]?.nome || k, value: v, fill: categoriasInfo[k]?.cor })));
    setGanhosPorCategoria(Object.entries(catGanhosMap).map(([k, v]) => ({ name: categoriasInfo[k]?.nome || k, value: v, fill: categoriasInfo[k]?.cor })));
    setGastosPorBanco(Object.entries(bancoMap).map(([k, v]) => ({ name: k, valor: v })));
  };

  const handleEdit = (lancamento) => { setLancamentoParaEditar(lancamento); setIsEditModalOpen(true); };
  const handleDelete = async (id) => { if (window.confirm("Tem certeza?")) { await deleteDoc(doc(db, 'usuarios', user.uid, 'lancamentos', id)); fetchData(); }};

  const formatarMoeda = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;
  const mesesAno = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dataGraficoAnual = mesesAno.map((mes, i) => ({ name: mes, Gastos: gastosAnuais.gastos[i], Ganhos: gastosAnuais.ganhos[i] }));

  const renderGraficos = (tipo) => {
    const dadosCategoria = tipo === 'gastos' ? gastosPorCategoria : ganhosPorCategoria;
    const tituloCategoria = tipo === 'gastos' ? "Gastos por Categoria" : "Ganhos por Categoria";
    
    return (
        <div className="charts-grid">
            {dadosCategoria.length > 0 && <div className="dashboard-card"><h3 className="title-medium">{tituloCategoria}</h3><ResponsiveContainer width="100%" height={400}><PieChart><Pie data={dadosCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{dadosCategoria.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Pie><Tooltip formatter={(v) => formatarMoeda(v)} /><Legend /></PieChart></ResponsiveContainer></div>}
            {tipo === 'gastos' && gastosPorBanco.length > 0 && <div className="dashboard-card"><h3 className="title-medium">Gastos por Banco</h3><ResponsiveContainer width="100%" height={400}><BarChart data={gastosPorBanco}><XAxis dataKey="name" /><YAxis tickFormatter={formatarMoeda} /><Tooltip formatter={(v) => formatarMoeda(v)} /><Bar dataKey="valor" fill="#8884d8" /></BarChart></ResponsiveContainer></div>}
        </div>
    );
  };
  
  return (
    <div className="dashboard-container">
      {isEditModalOpen && <EditModal user={user} lancamento={lancamentoParaEditar} onClose={(atualizou) => { setIsEditModalOpen(false); if (atualizou) fetchData(); }} />}
      {isExtratoOpen && <ExtratoDetalhado user={user} onClose={() => setIsExtratoOpen(false)} />}
      
      <div className="periodo-filtros-container">
          <div className="filtros-principais periodo-box">
              <button onClick={() => setDashboardFiltro('geral')} className={dashboardFiltro === 'geral' ? 'active' : ''}>Geral</button>
              <button onClick={() => setDashboardFiltro('gastos')} className={dashboardFiltro === 'gastos' ? 'active' : ''}>Gastos</button>
              <button onClick={() => setDashboardFiltro('ganhos')} className={dashboardFiltro === 'ganhos' ? 'active' : ''}>Ganhos</button>
          </div>
          <div className="filtros-secundarios">
              <div className="periodo-box">
                  <button onClick={() => setPeriodo('mensal')} className={periodo === 'mensal' ? 'active' : ''}>Mensal</button>
                  <button onClick={() => setPeriodo('anual')} className={periodo === 'anual' ? 'active' : ''}>Anual</button>
              </div>
          </div>
      </div>

      {loading ? <div className="loading-message"><p className="text-large">Carregando...</p></div> : (
        <>
            <button onClick={() => setIsExtratoOpen(true)} className="btn-primary" style={{marginBottom: '20px'}}>Ver Detalhes do Extrato</button>
            
            {dashboardFiltro === 'geral' && <div className="dashboard-card chart-full-width"><h3 className="title-medium">Ganhos vs Gastos (Anual)</h3><ResponsiveContainer width="100%" height={400}><BarChart data={dataGraficoAnual}><XAxis dataKey="name" /><YAxis tickFormatter={formatarMoeda} /><Tooltip formatter={(v) => formatarMoeda(v)} /><Legend /><Bar dataKey="Ganhos" fill="#34A853" /><Bar dataKey="Gastos" fill="#EA4335" /></BarChart></ResponsiveContainer></div>}
            
            {dashboardFiltro === 'gastos' && (
                <>
                    {renderGraficos('gastos')}
                    <div className="dashboard-card chart-full-width">
                        <h3 className="title-medium">Gastos Futuros</h3>
                        <div className="recent-expenses">
                            {gastosFuturos.length > 0 ? gastosFuturos.map((lanc) => (
                               <div key={lanc.id} className="expense-item">
                                    <div className="expense-info">
                                        <span className="expense-text">{categoriasInfo[lanc.categoria]?.icone} {lanc.descricao || categoriasInfo[lanc.categoria]?.nome}</span>
                                        {lanc.isParcelado && <span className="expense-parcela">(Parcela {lanc.parcelaAtual}/{lanc.totalParcelas})</span>}
                                    </div>
                                    <div className="expense-details">
                                        <span className="expense-value expense-text">{formatarMoeda(lanc.valor)}</span>
                                        <span className="expense-date">{lanc.data.toDate().toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric'})}</span>
                                    </div>
                                    <div className="expense-actions">
                                        <button onClick={() => handleEdit(lanc)} className="action-button">✏️</button>
                                        <button onClick={() => handleDelete(lanc.id)} className="action-button">🗑️</button>
                                    </div>
                                </div>
                            )) : <p>Nenhum gasto futuro encontrado.</p>}
                        </div>
                    </div>
                </>
            )}

            {dashboardFiltro === 'ganhos' && renderGraficos('ganhos')}

            <div className="dashboard-card">
              <h3 className="title-medium">Últimos Lançamentos (Período)</h3>
              <div className="recent-expenses">
                {lancamentos.slice(0, 15).map((lanc) => (
                  <div key={lanc.id} className="expense-item">
                    <div className="expense-info">
                      <span className={lanc.tipo === 'despesa' ? 'expense-text' : 'income-text'}>{categoriasInfo[lanc.categoria]?.icone} {lanc.descricao || categoriasInfo[lanc.categoria]?.nome}</span>
                      {lanc.isParcelado && <span className="expense-parcela">(Parcela {lanc.parcelaAtual}/{lanc.totalParcelas})</span>}
                    </div>
                    <div className="expense-details"><span className={`expense-value ${lanc.tipo === 'despesa' ? 'expense-text' : 'income-text'}`}>{formatarMoeda(lanc.valor)}</span><span className="expense-date">{lanc.data.toDate().toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric'})}</span></div>
                    <div className="expense-actions"><button onClick={() => handleEdit(lanc)} className="action-button">✏️</button><button onClick={() => handleDelete(lanc.id)} className="action-button">🗑️</button></div>
                  </div>
                ))}
              </div>
            </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

