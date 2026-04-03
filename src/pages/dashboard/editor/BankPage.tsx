import React, { useState, useEffect } from 'react';
import { Wallet, Clock, CheckCircle, Download, Loader2, ArrowRight, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';

const BankPage: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [pendingBalance, setPendingBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [pixKey, setPixKey] = useState('');
    const [pixType, setPixType] = useState('CPF');

    useEffect(() => {
        if (user) {
            loadFinancialData();
        }
    }, [user]);

    const loadFinancialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Profile Balance
            const { data: profile } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', user?.id)
                .single();
            setBalance(Number(profile?.balance || 0));

            // 2. Fetch Pending Projects (Pendente)
            const { data: projects } = await supabase
                .from('projects')
                .select('final_price, status')
                .eq('editor_id', user?.id)
                .in('status', ['Em Edição', 'Aguardando Pagamento']);
            
            const pending = projects?.reduce((acc, p) => acc + Number(p.final_price || 0), 0) || 0;
            setPendingBalance(pending);

            // 3. Fetch Transactions
            const { data: txs } = await supabase
                .from('wallet_transactions')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });
            setTransactions(txs || []);

        } catch (err) {
            console.error('Error loading financial data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(withdrawAmount);

        if (amount <= 0 || amount > balance) {
            alert('Valor inválido ou insuficiente.');
            return;
        }

        if (!pixKey) {
            alert('Por favor, informe sua chave PIX.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('wallet_transactions')
                .insert({
                    user_id: user?.id,
                    amount: amount,
                    type: 'WITHDRAWAL',
                    status: 'AWAITING_APPROVAL',
                    description: `Resgate via PIX (${pixType})`,
                    metadata: {
                        pixKey,
                        pixKeyType: pixType
                    }
                });

            if (error) throw error;

            alert('Solicitação de saque enviada com sucesso!');
            setIsWithdrawModalOpen(false);
            setWithdrawAmount('');
            loadFinancialData();
        } catch (err: any) {
            alert(`Erro ao solicitar saque: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent)" />
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Minha Carteira</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Gerencie seus ganhos e acompanhe o status dos seus pagamentos.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div className="glass" style={{ padding: '32px', borderRadius: '24px', borderLeft: '4px solid #a855f7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                                <Wallet size={24} />
                            </div>
                            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Saldo Disponível</span>
                        </div>
                        <button 
                            onClick={() => setIsWithdrawModalOpen(true)}
                            className="btn-primary"
                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                            Solicitar Saque
                        </button>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>R$ {balance.toFixed(2)}</div>
                    <p style={{ color: '#4ade80', fontSize: '0.85rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> Tudo em dia
                    </p>
                </div>

                <div className="glass" style={{ padding: '32px', borderRadius: '24px', borderLeft: '4px solid #fbbf24' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                            <Clock size={24} />
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Saldo Pendente</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>R$ {pendingBalance.toFixed(2)}</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Aguardando finalização do projeto</p>
                </div>
            </div>

            <div className="glass" style={{ padding: '32px', borderRadius: '24px', minHeight: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Histórico de Lançamentos</h2>
                    <button style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={16} /> Exportar
                    </button>
                </div>

                {transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        <Clock size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                        <p>Nenhuma transação encontrada.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>DATA</th>
                                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>DESCRIÇÃO</th>
                                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>TIPO</th>
                                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>VALOR</th>
                                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '16px 12px', fontSize: '0.9rem' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px 12px', fontSize: '0.9rem' }}>{tx.description}</td>
                                        <td style={{ padding: '16px 12px', fontSize: '0.8rem' }}>
                                            <span style={{ 
                                                padding: '4px 8px', borderRadius: '4px', 
                                                background: tx.type === 'TOPUP' || tx.type === 'PAYMENT' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: tx.type === 'TOPUP' || tx.type === 'PAYMENT' ? '#4ade80' : '#ef4444'
                                            }}>
                                                {tx.type === 'TOPUP' || tx.type === 'PAYMENT' ? 'Entrada' : 'Saída'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 12px', fontWeight: 600 }}>R$ {tx.amount.toFixed(2)}</td>
                                        <td style={{ padding: '16px 12px', fontSize: '0.85rem' }}>
                                            <span style={{ 
                                                color: tx.status === 'SUCCESS' ? '#4ade80' : 
                                                       tx.status === 'AWAITING_APPROVAL' || tx.status === 'PENDING' ? '#fbbf24' : '#ef4444'
                                            }}>
                                                {tx.status === 'SUCCESS' ? 'Concluído' : 
                                                 tx.status === 'AWAITING_APPROVAL' ? 'Aguardando Aprovação' :
                                                 tx.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Withdrawal Modal */}
            {isWithdrawModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px', position: 'relative' }}>
                        <button onClick={() => setIsWithdrawModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(168,85,247,0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Wallet size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Solicitar Resgate</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>O valor será enviado via PIX para sua conta.</p>
                        </div>

                        <form onSubmit={handleRequestWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Valor do Saque</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>R$</span>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        className="auth-input"
                                        style={{ paddingLeft: '45px' }}
                                        placeholder="0,00"
                                        required
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                    />
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
                                    Saldo disponível: <strong style={{ color: 'var(--text-main)' }}>R$ {balance.toFixed(2)}</strong>
                                </span>
                            </div>

                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Tipo de Chave PIX</label>
                                <select 
                                    className="auth-input"
                                    value={pixType}
                                    onChange={(e) => setPixType(e.target.value)}
                                >
                                    <option value="CPF">CPF</option>
                                    <option value="CNPJ">CNPJ</option>
                                    <option value="CELULAR">Celular</option>
                                    <option value="EMAIL">E-mail</option>
                                    <option value="EVP">Chave Aleatória</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Sua Chave PIX</label>
                                <input 
                                    type="text" 
                                    className="auth-input"
                                    placeholder="Digite sua chave aqui..."
                                    required
                                    value={pixKey}
                                    onChange={(e) => setPixKey(e.target.value)}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn-primary"
                                disabled={isSubmitting || !withdrawAmount || Number(withdrawAmount) > balance}
                                style={{ 
                                    width: '100%', padding: '16px', borderRadius: '12px', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    opacity: (isSubmitting || !withdrawAmount || Number(withdrawAmount) > balance) ? 0.5 : 1
                                }}
                            >
                                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>Confirmar Solicitação <ArrowRight size={20} /></>}
                            </button>

                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <AlertCircle size={12} /> A aprovação pelo admin pode levar até 24h úteis.
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BankPage;
