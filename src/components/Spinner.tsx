export function Spinner({ text }: { text: string }) {
  return (
    <div className="spinner" role="status">
      <div className="spinner-circle" />
      <span>{text}</span>
    </div>
  );
}
