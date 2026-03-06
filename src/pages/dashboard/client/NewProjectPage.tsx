import React from 'react';

const NewProjectPage: React.FC = () => {
    return (
        <div className="glass" style={{ padding: '32px', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', color: 'var(--text-main)' }}>Novo Projeto</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px' }}>
                Descreva a edição que você precisa, anexe arquivos e encontre o editor ideal para o seu vídeo. (Em breve)
            </p>
        </div>
    );
};

export default NewProjectPage;
