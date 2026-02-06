import type { PropsWithChildren, ReactNode } from 'react';

interface CardProps {
  title?: string;
  actions?: ReactNode;
  className?: string;
}

export function Card({ title, actions, className = '', children }: PropsWithChildren<CardProps>) {
  return (
    <section className={`card ${className}`.trim()}>
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
