import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';

interface CardProps {
  title?: string;
  actions?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Card({ title, actions, className = '', style, onClick, children }: PropsWithChildren<CardProps>) {
  const isClickable = typeof onClick === 'function';

  return (
    <section
      className={`card ${isClickable ? 'card-clickable' : ''} ${className}`.trim()}
      style={style}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {(title || actions) && (
        <header className="card-header">
          {title && <h3>{title}</h3>}
          {actions}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
