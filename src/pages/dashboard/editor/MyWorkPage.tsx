import React from 'react';

const MyWorkPage: React.FC = () => {
    return (
        <div className="glass" style={{ padding: '32px', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', color: 'var(--text-main)' }}>Minhas Edições</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px' }}>
                Organize seus trabalhos em andamento, entregas pendentes e pagamentos recebidos. (Em breve)
            </p>
        </div>
    );
};

export default MyWorkPage;
