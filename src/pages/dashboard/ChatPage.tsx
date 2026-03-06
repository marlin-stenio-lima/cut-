import React from 'react';

const ChatPage: React.FC = () => {
    return (
        <div className="glass" style={{ padding: '32px', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', color: 'var(--text-main)' }}>Mensagens</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px' }}>
                Converse com clientes e editores para alinhar detalhes dos projetos. O sistema de chat será implementado em breve.
            </p>
        </div>
    );
};

export default ChatPage;
