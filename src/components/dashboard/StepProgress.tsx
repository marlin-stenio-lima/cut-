import React from 'react';

interface StepProgressProps {
    steps: string[];
    currentStep: number;
}

const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
            {/* Background Line */}
            <div style={{
                position: 'absolute',
                top: '15px',
                left: '0',
                right: '0',
                height: '2px',
                background: 'rgba(255, 255, 255, 0.1)',
                zIndex: 0
            }} />

            {/* Steps */}
            {steps.map((step, index) => {
                const isActive = index <= currentStep;
                const isCurrent = index === currentStep;

                return (
                    <div key={index} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 1,
                        width: '80px'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isActive ? 'var(--accent)' : 'var(--bg-card)',
                            border: '2px solid',
                            borderColor: isActive ? 'var(--accent)' : 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: isActive ? 'white' : 'var(--text-muted)',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            transition: 'all 0.3s ease',
                            boxShadow: isCurrent ? '0 0 15px var(--accent-glow)' : 'none'
                        }}>
                            {index + 1}
                        </div>
                        <span style={{
                            marginTop: '8px',
                            fontSize: '0.7rem',
                            color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                            fontWeight: isActive ? 600 : 400,
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            {step}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default StepProgress;
