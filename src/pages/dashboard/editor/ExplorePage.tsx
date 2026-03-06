import React from 'react';

const ExplorePage: React.FC = () => {
    return (
        <div className="glass" style={{ padding: '32px', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', color: 'var(--text-main)' }}>Explorar Projetos</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px' }}>
                Encontre projetos de clientes que combinam com seu estilo de edição e envie suas propostas. (Em breve)
            </p>
        </div>
    );
};

export default ExplorePage;
