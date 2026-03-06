import React from 'react';

const MyProjectsPage: React.FC = () => {
    return (
        <div className="glass" style={{ padding: '32px', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', color: 'var(--text-main)' }}>Meus Projetos</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px' }}>
                Acompanhe o andamento das suas edições aprovadas e gerencie as entregas dos editores. (Em breve)
            </p>
        </div>
    );
};

export default MyProjectsPage;
