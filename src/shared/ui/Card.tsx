import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';

interface CardProps {
  title?: string;
  actions?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Card({ title, actions, className = '', style, onClick, children }: PropsWithChildren<CardProps>) {
  return (
    <section className={`card ${className}`.trim()} style={style} onClick={onClick}>
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
