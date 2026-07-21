export function CalendarIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#394830" strokeWidth="2.5"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18m-13 4h3v3H8z"/></svg>;
}

export function ChevronIcon() {
  return <svg width="13" height="8" viewBox="0 0 13 8" fill="none" stroke="currentColor" strokeWidth="2"><path d="m1 1 5.5 5L12 1"/></svg>;
}

export function SparkleIcon() {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>;
}

export function CrownIcon({ large = false }: { large?: boolean }) {
  const size = large ? 48 : 31;
  return <svg width={size} height={size} viewBox="0 0 48 48" fill="currentColor"><path d="M8 35h32l3-21-11 8-8-14-8 14-11-8 3 21Zm3 5h26v4H11z"/></svg>;
}

export function CheckIcon() {
  return <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#30402e" strokeWidth="3"><path d="m4 12 5 5L20 6"/></svg>;
}
