import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
    const boxSize = size === 'sm' ? '24px' : size === 'md' ? '32px' : '48px';
    const fontSize = size === 'sm' ? '1rem' : size === 'md' ? '1.25rem' : '2rem';

    return (
        <Link
            to="/"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: size === 'sm' ? '8px' : '10px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'opacity 0.2s'
            }}
            className={`logo-container ${className}`}
        >
            <div style={{
                width: boxSize,
                height: boxSize,
                borderRadius: size === 'sm' ? '4px' : '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden'
            }}>
                <img src="/logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {showText && (
                <span style={{
                    fontSize: fontSize,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'inherit'
                }}>
                    CutHouse
                </span>
            )}
        </Link>
    );
};

export default Logo;
