export function confirmDestructiveAction(message: string): boolean {
  return window.confirm(`${message}\n\nThis operation cannot be undone.`);
}
