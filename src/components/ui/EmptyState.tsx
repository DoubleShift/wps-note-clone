interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = "📝", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-medium text-text mb-1">{title}</h3>
      {description && <p className="text-sm text-text-secondary mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}